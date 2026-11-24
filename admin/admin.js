/*
 * Painel administrativo do TaxiCampos
 *
 * O site é estático, então este painel:
 *  - edita os dados no navegador;
 *  - publica as alterações (dados.js + fotos) direto no repositório
 *    pela API do GitHub, usando um token pessoal que fica salvo só
 *    no navegador de quem administra.
 *
 * O login abaixo só esconde o painel. Ele fica visível no código-fonte.
 * A proteção de verdade é o token do GitHub: sem ele ninguém consegue salvar.
 */
(function () {
  "use strict";

  var CONFIG = {
    usuario: "admin",
    senha: "admin",
    repo: "Henrique-Inf/TaxiCampos",
    branch: "main",
    arquivoDados: "dados.js",
    pastaFotos: "fotos",
    tamanhoFoto: 480
  };

  var CHAVE_SESSAO = "taxicampos_admin_sessao";
  var CHAVE_TOKEN = "taxicampos_admin_token";

  var raiz = document.getElementById("admin");
  var dialogo = document.getElementById("dialogo");

  var estado = {
    dados: null,          // dados em edição
    original: "",         // JSON dos dados como estavam ao carregar/salvar
    baseSha: null,        // commit de onde os dados foram lidos
    fotosPendentes: {},   // caminho -> dataURL (fotos novas ainda não publicadas)
    fotosCache: {},       // caminho -> dataURL (fotos já publicadas nesta sessão)
    tela: { tipo: "inicio", ponto: -1 },
    status: null,         // { texto, tipo }
    salvando: false,
    rascunho: null        // taxista sendo editado no diálogo
  };

  /* =========================================================
   * Utilitários
   * ========================================================= */

  function lerStorage(tipo, chave) {
    try { return window[tipo].getItem(chave); } catch (e) { return null; }
  }
  function gravarStorage(tipo, chave, valor) {
    try {
      if (valor == null) window[tipo].removeItem(chave);
      else window[tipo].setItem(chave, valor);
    } catch (e) { /* navegador sem storage: segue sem lembrar */ }
  }
  function token() { return lerStorage("localStorage", CHAVE_TOKEN); }

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function slug(texto) {
    return String(texto || "").toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function txt(v) { return String(v == null ? "" : v).trim(); }
  function digitos(v) { return String(v || "").replace(/\D/g, ""); }

  function formatarTelefone(v) {
    var d = digitos(v);
    if ((d.length === 12 || d.length === 13) && d.indexOf("55") === 0) d = d.slice(2);
    if (d.length === 8 || d.length === 9) d = txt(estado.dados && estado.dados.dddPadrao) + d;
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return txt(v);
  }
  function telefoneValido(v) {
    var d = digitos(v);
    return d.length >= 8 && d.length <= 13;
  }

  function iniciais(nome) {
    var p = txt(nome || "?").split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase();
  }

  function fotoSrc(caminho) {
    if (!caminho) return "";
    return estado.fotosPendentes[caminho] || estado.fotosCache[caminho] || "../" + caminho;
  }

  function htmlFoto(t, classe) {
    var src = fotoSrc(t.foto);
    return src
      ? '<img class="foto ' + classe + '" src="' + esc(src) + '" alt="" data-iniciais="' + esc(iniciais(t.nome)) + '">'
      : '<span class="foto foto-iniciais ' + classe + '" aria-hidden="true">' + esc(iniciais(t.nome)) + "</span>";
  }

  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  /* =========================================================
   * Dados: normalizar, validar, serializar
   * ========================================================= */

  function normalizar(d) {
    d = d || {};
    var ids = {};
    return {
      cidade: txt(d.cidade),
      dddPadrao: digitos(d.dddPadrao),
      mensagemWhatsapp: txt(d.mensagemWhatsapp),
      pontos: (d.pontos || []).map(function (p) {
        var id = slug(p.id) || slug(p.nome) || "ponto";
        var base = id, n = 2;
        while (ids[id]) id = base + "-" + n++;
        ids[id] = true;
        return {
          id: id,
          numero: txt(p.numero),
          nome: txt(p.nome),
          endereco: txt(p.endereco),
          telefone: txt(p.telefone),
          taxistas: (p.taxistas || []).map(function (t) {
            var o = { nome: txt(t.nome), carro: txt(t.carro), telefone: txt(t.telefone) };
            if (txt(t.whatsapp)) o.whatsapp = txt(t.whatsapp);
            o.foto = txt(t.foto);
            return o;
          })
        };
      })
    };
  }

  function validar(d) {
    var erros = [];
    d.pontos.forEach(function (p, i) {
      var nomePonto = p.nome || "Ponto " + (p.numero || i + 1);
      if (!p.nome) erros.push(nomePonto + ": o ponto está sem nome.");
      if (p.telefone && !telefoneValido(p.telefone)) erros.push(nomePonto + ": telefone do ponto inválido.");
      p.taxistas.forEach(function (t, j) {
        var quem = nomePonto + " → " + (t.nome || "taxista nº " + (j + 1));
        if (!t.nome) erros.push(quem + ": falta o nome.");
        if (!telefoneValido(t.telefone)) erros.push(quem + ": telefone inválido ou vazio.");
        if (t.whatsapp && !telefoneValido(t.whatsapp)) erros.push(quem + ": número de WhatsApp inválido.");
      });
    });
    return erros;
  }

  function fotosUsadas(d) {
    var usadas = {};
    (d.pontos || []).forEach(function (p) {
      (p.taxistas || []).forEach(function (t) { if (t.foto) usadas[t.foto] = true; });
    });
    return usadas;
  }

  var CABECALHO =
    "/*\n" +
    " * ============================================================\n" +
    " *  DADOS DO SITE (pontos de táxi e taxistas)\n" +
    " * ============================================================\n" +
    " *\n" +
    " * O jeito mais fácil de editar é pelo painel: <endereço do site>/admin\n" +
    " * Também dá para editar este arquivo à mão.\n" +
    " *\n" +
    " * Cada ponto tem:\n" +
    " *   id        → identificador único, sem espaços nem acentos (usado no link)\n" +
    " *   numero    → número do ponto (ex.: \"12\")\n" +
    " *   nome      → nome do ponto\n" +
    " *   endereco  → (opcional) endereço ou referência\n" +
    " *   telefone  → (opcional) telefone fixo do ponto\n" +
    " *   taxistas  → lista de taxistas do ponto\n" +
    " *\n" +
    " * Cada taxista tem:\n" +
    " *   nome      → nome do taxista\n" +
    " *   carro     → (opcional) modelo do carro\n" +
    " *   telefone  → celular com DDD, ex.: \"(12) 99999-0000\"\n" +
    " *   whatsapp  → (opcional) número do WhatsApp, se for diferente do telefone\n" +
    " *   foto      → (opcional) caminho da foto, ex.: \"fotos/joao.jpg\"\n" +
    " *\n" +
    " * Na mensagem do WhatsApp, {nome} é trocado pelo primeiro nome do taxista\n" +
    " * e {ponto} pelo nome do ponto.\n" +
    " */\n\n";

  function serializar(d) {
    return CABECALHO + "window.TAXI_DADOS = " + JSON.stringify(d, null, 2) + ";\n";
  }

  function lerDadosJs(codigo) {
    var janela = {};
    new Function("window", codigo)(janela);
    if (!janela.TAXI_DADOS) throw new Error("dados.js não define window.TAXI_DADOS");
    return janela.TAXI_DADOS;
  }

  function definirDados(d, sha) {
    var n = normalizar(d);
    estado.dados = n;
    estado.original = JSON.stringify(n);
    estado.baseSha = sha || null;
  }

  function estaSujo() {
    return !!estado.dados && JSON.stringify(normalizar(estado.dados)) !== estado.original;
  }

  /* =========================================================
   * GitHub
   * ========================================================= */

  function gh(metodo, caminho, corpo, tokenUsado) {
    var headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + (tokenUsado || token()),
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (corpo) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + CONFIG.repo + caminho, {
      method: metodo,
      headers: headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store"
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          var e = new Error("GitHub respondeu " + r.status + ": " + t.slice(0, 200));
          e.status = r.status;
          throw e;
        });
      }
      return r.status === 204 ? null : r.json();
    });
  }

  function base64ParaTexto(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function carregarRemoto() {
    var ref = await gh("GET", "/git/ref/heads/" + CONFIG.branch);
    var sha = ref.object.sha;
    var arq = await gh("GET", "/contents/" + CONFIG.arquivoDados + "?ref=" + sha);
    return { sha: sha, dados: lerDadosJs(base64ParaTexto(arq.content)) };
  }

  function mensagemErro(e) {
    if (e instanceof TypeError) return "Sem conexão com o GitHub. Verifique a internet e tente de novo.";
    switch (e.status) {
      case 401: return "Token do GitHub inválido ou expirado. Clique em “GitHub” no topo para conectar de novo.";
      case 403:
      case 404: return "O token não tem permissão de escrita no repositório " + CONFIG.repo + ". Confira a permissão “Contents: Read and write”.";
      case 409:
      case 422: return "O GitHub recusou a gravação (alguém pode ter salvo ao mesmo tempo). Tente salvar de novo.";
      default: return e.message || "Erro desconhecido.";
    }
  }

  async function salvar() {
    if (estado.salvando) return;
    var dados = normalizar(estado.dados);
    var erros = validar(dados);
    if (erros.length) { mostrarErros(erros); return; }

    if (!token()) {
      var conectou = await abrirToken(true);
      if (!conectou) return;
    }

    estado.salvando = true;
    definirStatus("Publicando…", "info");
    try {
      var remoto = await carregarRemoto();

      if (remoto.sha !== estado.baseSha &&
          JSON.stringify(normalizar(remoto.dados)) !== estado.original) {
        var seguir = window.confirm(
          "Os dados no GitHub estão diferentes dos que foram carregados neste painel " +
          "(alguém salvou depois, ou o site ainda não tinha atualizado).\n\n" +
          "Se continuar, o que está lá será substituído pelo que está aqui. Continuar?"
        );
        if (!seguir) {
          definirStatus("Publicação cancelada. Recarregue a página para pegar os dados mais recentes.", "erro");
          return;
        }
      }

      var commitBase = await gh("GET", "/git/commits/" + remoto.sha);
      var arvore = await gh("GET", "/git/trees/" + commitBase.tree.sha + "?recursive=1");
      var existentes = {};
      (arvore.tree || []).forEach(function (x) { existentes[x.path] = true; });

      var usadas = fotosUsadas(dados);
      var entradas = [];

      var pendentes = Object.keys(estado.fotosPendentes);
      for (var i = 0; i < pendentes.length; i++) {
        var caminho = pendentes[i];
        if (!usadas[caminho]) continue;
        definirStatus("Enviando fotos… (" + (i + 1) + "/" + pendentes.length + ")", "info");
        var blob = await gh("POST", "/git/blobs", {
          content: estado.fotosPendentes[caminho].split(",")[1],
          encoding: "base64"
        });
        entradas.push({ path: caminho, mode: "100644", type: "blob", sha: blob.sha });
      }

      entradas.push({ path: CONFIG.arquivoDados, mode: "100644", type: "blob", content: serializar(dados) });

      // apaga fotos que deixaram de ser usadas
      Object.keys(fotosUsadas(normalizar(remoto.dados))).forEach(function (c) {
        if (!usadas[c] && existentes[c] && c.indexOf(CONFIG.pastaFotos + "/") === 0) {
          entradas.push({ path: c, mode: "100644", type: "blob", sha: null });
        }
      });

      definirStatus("Publicando…", "info");
      var novaArvore = await gh("POST", "/git/trees", { base_tree: commitBase.tree.sha, tree: entradas });
      var novoCommit = await gh("POST", "/git/commits", {
        message: "Atualiza pontos e taxistas pelo painel admin",
        tree: novaArvore.sha,
        parents: [remoto.sha]
      });
      await gh("PATCH", "/git/refs/heads/" + CONFIG.branch, { sha: novoCommit.sha });

      Object.keys(estado.fotosPendentes).forEach(function (c) { estado.fotosCache[c] = estado.fotosPendentes[c]; });
      estado.fotosPendentes = {};
      definirDados(dados, novoCommit.sha);
      render();
      definirStatus("Publicado! O site é atualizado em 1 a 2 minutos.", "ok");
    } catch (e) {
      definirStatus(mensagemErro(e), "erro");
    } finally {
      estado.salvando = false;
      atualizarBarra();
    }
  }

  function baixar() {
    var conteudo = serializar(normalizar(estado.dados));
    var url = URL.createObjectURL(new Blob([conteudo], { type: "text/javascript;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "dados.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    if (Object.keys(estado.fotosPendentes).length) {
      definirStatus("Atenção: as fotos novas só são enviadas usando “Salvar e publicar”.", "erro");
    }
  }

  /* =========================================================
   * Fotos
   * ========================================================= */

  function processarFoto(arquivo) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var lado = Math.min(w, h);
        var sx = (w - lado) / 2;
        var sy = (h - lado) * 0.3; // em fotos em pé, puxa o corte para cima (rosto)
        var tam = Math.min(CONFIG.tamanhoFoto, lado);
        var c = document.createElement("canvas");
        c.width = c.height = tam;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, tam, tam);
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tam, tam);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Não consegui abrir essa imagem. Tente outra (JPG ou PNG)."));
      };
      img.src = url;
    });
  }

  /* =========================================================
   * Telas
   * ========================================================= */

  function renderLogin(erro) {
    raiz.innerHTML =
      '<div class="login">' +
        '<form class="login-cartao" id="form-login">' +
          '<div class="marca"><span class="marca-icone" aria-hidden="true">🚕</span><span class="marca-texto">Taxi<strong>Campos</strong></span></div>' +
          '<p class="login-sub">Painel administrativo</p>' +
          '<label>Usuário<input name="usuario" autocomplete="username" required autofocus></label>' +
          '<label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>' +
          (erro ? '<p class="erro">' + esc(erro) + "</p>" : "") +
          '<button class="botao botao-primario" type="submit">Entrar</button>' +
        "</form>" +
      "</div>";
    document.getElementById("form-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (f.usuario.value.trim() === CONFIG.usuario && f.senha.value === CONFIG.senha) {
        gravarStorage("sessionStorage", CHAVE_SESSAO, "1");
        carregarDados();
      } else {
        renderLogin("Usuário ou senha incorretos.");
      }
    });
  }

  async function carregarDados() {
    raiz.innerHTML = '<p class="carregando">Carregando dados…</p>';
    var aviso = null;
    if (token()) {
      try {
        var r = await carregarRemoto();
        definirDados(r.dados, r.sha);
        render();
        return;
      } catch (e) {
        aviso = "Não consegui ler os dados do GitHub: " + mensagemErro(e) + " Mostrando os dados publicados no site.";
      }
    }
    definirDados(window.TAXI_DADOS || { pontos: [] }, null);
    render();
    if (aviso) definirStatus(aviso, "erro");
  }

  function render() {
    var corpo = estado.tela.tipo === "ponto" && estado.dados.pontos[estado.tela.ponto]
      ? telaPonto(estado.tela.ponto)
      : telaInicio();

    raiz.innerHTML =
      '<header class="topo topo-admin">' +
        '<div class="topo-linha">' +
          '<span class="marca"><span class="marca-icone" aria-hidden="true">🚕</span><span class="marca-texto">Taxi<strong>Campos</strong></span> <span class="selo">Admin</span></span>' +
          '<nav class="topo-acoes">' +
            '<a class="link-topo" href="../" target="_blank" rel="noopener">Ver site</a>' +
            '<button type="button" class="link-topo" data-acao="github">GitHub' +
              (token() ? ' <span class="ponto-status ok" title="Conectado"></span>' : ' <span class="ponto-status" title="Não conectado"></span>') +
            "</button>" +
            '<button type="button" class="link-topo" data-acao="sair">Sair</button>' +
          "</nav>" +
        "</div>" +
      "</header>" +
      '<main class="conteudo admin-conteudo">' + corpo + "</main>" +
      '<div class="barra-salvar">' +
        '<div class="barra-dentro">' +
          '<span class="barra-status" id="barra-status" role="status"></span>' +
          '<div class="barra-botoes">' +
            '<button type="button" class="botao botao-secundario" data-acao="baixar">Baixar dados.js</button>' +
            '<button type="button" class="botao botao-primario" data-acao="salvar" id="botao-salvar">Salvar e publicar</button>' +
          "</div>" +
        "</div>" +
      "</div>";
    atualizarBarra();
  }

  function telaInicio() {
    var d = estado.dados;
    document.title = "Admin — TaxiCampos";
    var linhas = d.pontos.map(function (p, i) {
      var n = p.taxistas.length;
      return (
        '<div class="linha">' +
          '<button type="button" class="linha-principal" data-acao="abrir-ponto" data-i="' + i + '">' +
            '<span class="ponto-numero mini"><small>Ponto</small>' + esc(p.numero || "–") + "</span>" +
            '<span class="linha-texto"><strong>' + esc(p.nome || "(sem nome)") + "</strong>" +
              "<span>" + plural(n, "taxista", "taxistas") + (p.endereco ? " · " + esc(p.endereco) : "") + "</span></span>" +
          "</button>" +
          acoesLinha("ponto", i, d.pontos.length) +
        "</div>"
      );
    }).join("");

    return (
      '<details class="cartao config">' +
        "<summary>Configurações gerais</summary>" +
        '<div class="campos">' +
          '<label>Cidade<input data-campo="cidade" value="' + esc(d.cidade) + '"></label>' +
          '<label>DDD padrão<input data-campo="dddPadrao" inputmode="numeric" maxlength="2" value="' + esc(d.dddPadrao) + '"></label>' +
          '<label class="largo">Mensagem do WhatsApp' +
            '<textarea data-campo="mensagemWhatsapp" rows="3">' + esc(d.mensagemWhatsapp) + "</textarea>" +
            "<small>{nome} vira o primeiro nome do taxista e {ponto} vira o nome do ponto.</small>" +
          "</label>" +
        "</div>" +
      "</details>" +
      '<div class="secao-titulo">' +
        "<h2>" + plural(d.pontos.length, "ponto", "pontos") + "</h2>" +
        '<button type="button" class="botao botao-primario pequeno" data-acao="novo-ponto">+ Novo ponto</button>' +
      "</div>" +
      (linhas ? '<div class="lista-admin">' + linhas + "</div>" : '<p class="vazio">Nenhum ponto ainda. Clique em “+ Novo ponto”.</p>')
    );
  }

  function telaPonto(i) {
    var p = estado.dados.pontos[i];
    document.title = (p.nome || "Ponto") + " — Admin TaxiCampos";
    var linhas = p.taxistas.map(function (t, j) {
      var detalhe = [t.carro, t.telefone].filter(Boolean).map(esc).join(" · ");
      return (
        '<div class="linha">' +
          '<button type="button" class="linha-principal" data-acao="editar-taxista" data-i="' + j + '">' +
            htmlFoto(t, "mini") +
            '<span class="linha-texto"><strong>' + esc(t.nome || "(sem nome)") + "</strong><span>" + detalhe + "</span></span>" +
          "</button>" +
          acoesLinha("taxista", j, p.taxistas.length) +
        "</div>"
      );
    }).join("");

    return (
      '<button type="button" class="voltar" data-acao="inicio">← Todos os pontos</button>' +
      '<section class="cartao">' +
        '<div class="cartao-topo"><h2>Dados do ponto</h2>' +
          '<button type="button" class="botao-link" data-acao="excluir-ponto" data-i="' + i + '">Excluir ponto</button></div>' +
        '<div class="campos">' +
          '<label>Número<input data-campo="ponto.numero" value="' + esc(p.numero) + '"></label>' +
          '<label>Telefone do ponto (opcional)<input data-campo="ponto.telefone" data-tel inputmode="tel" value="' + esc(p.telefone) + '"></label>' +
          '<label class="largo">Nome *<input data-campo="ponto.nome" value="' + esc(p.nome) + '" placeholder="Ex.: Ponto Capivari"></label>' +
          '<label class="largo">Endereço / referência (opcional)<input data-campo="ponto.endereco" value="' + esc(p.endereco) + '"></label>' +
        "</div>" +
      "</section>" +
      '<div class="secao-titulo">' +
        "<h2>" + plural(p.taxistas.length, "taxista", "taxistas") + "</h2>" +
        '<button type="button" class="botao botao-primario pequeno" data-acao="novo-taxista">+ Novo taxista</button>' +
      "</div>" +
      (linhas ? '<div class="lista-admin">' + linhas + "</div>" : '<p class="vazio">Nenhum taxista neste ponto ainda.</p>')
    );
  }

  function acoesLinha(tipo, i, total) {
    return (
      '<div class="linha-acoes">' +
        '<button type="button" class="icone" data-acao="mover-' + tipo + '" data-i="' + i + '" data-d="-1" aria-label="Mover para cima"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
        '<button type="button" class="icone" data-acao="mover-' + tipo + '" data-i="' + i + '" data-d="1" aria-label="Mover para baixo"' + (i === total - 1 ? " disabled" : "") + ">↓</button>" +
        '<button type="button" class="icone perigo" data-acao="excluir-' + tipo + '" data-i="' + i + '" aria-label="Excluir">✕</button>' +
      "</div>"
    );
  }

  /* ---------- barra de salvar ---------- */

  function definirStatus(texto, tipo) {
    estado.status = texto ? { texto: texto, tipo: tipo || "info" } : null;
    atualizarBarra();
  }

  function atualizarBarra() {
    var el = document.getElementById("barra-status");
    var botao = document.getElementById("botao-salvar");
    if (!el || !botao) return;
    var sujo = estaSujo();
    var s = estado.status;
    if (!s) s = sujo ? { texto: "Alterações não publicadas", tipo: "sujo" } : { texto: "Tudo publicado", tipo: "calmo" };
    el.textContent = s.texto;
    el.className = "barra-status " + s.tipo;
    botao.disabled = estado.salvando || !sujo;
    botao.textContent = estado.salvando ? "Publicando…" : "Salvar e publicar";
  }

  /* =========================================================
   * Diálogos
   * ========================================================= */

  function abrirDialogo(html) {
    dialogo.innerHTML = html;
    if (!dialogo.open) dialogo.showModal();
  }

  function mostrarErros(erros) {
    abrirDialogo(
      '<div class="dlg">' +
        "<h2>Corrija antes de publicar</h2>" +
        '<ul class="lista-erros">' + erros.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" +
        '<div class="dlg-botoes"><button type="button" class="botao botao-primario" data-acao="fechar-dialogo">Entendi</button></div>' +
      "</div>"
    );
  }

  function abrirTaxista(pontoIdx, idx) {
    var p = estado.dados.pontos[pontoIdx];
    var t = idx >= 0 ? p.taxistas[idx] : { nome: "", carro: "", telefone: "", whatsapp: "", foto: "" };
    estado.rascunho = { pontoIdx: pontoIdx, idx: idx, foto: t.foto || "", fotoNova: null };

    var opcoes = estado.dados.pontos.map(function (pp, k) {
      return '<option value="' + k + '"' + (k === pontoIdx ? " selected" : "") + ">" +
        esc((pp.numero ? pp.numero + " · " : "") + (pp.nome || "(sem nome)")) + "</option>";
    }).join("");

    abrirDialogo(
      '<form class="dlg" id="form-taxista" novalidate>' +
        "<h2>" + (idx >= 0 ? "Editar taxista" : "Novo taxista") + "</h2>" +
        '<div class="foto-editor">' +
          '<div id="foto-preview"></div>' +
          '<div class="foto-botoes">' +
            '<label class="botao botao-secundario pequeno">Escolher foto' +
              '<input type="file" accept="image/*" id="foto-arquivo" hidden></label>' +
            '<button type="button" class="botao-link" data-acao="remover-foto" id="remover-foto">Remover foto</button>' +
            '<small id="foto-info">A foto é cortada em quadrado e reduzida automaticamente.</small>' +
          "</div>" +
        "</div>" +
        '<div class="campos">' +
          '<label class="largo">Nome *<input name="nome" value="' + esc(t.nome) + '" required></label>' +
          '<label class="largo">Modelo do carro<input name="carro" value="' + esc(t.carro) + '" placeholder="Ex.: Chevrolet Spin Prata"></label>' +
          '<label>Telefone *<input name="telefone" data-tel inputmode="tel" value="' + esc(t.telefone) + '" placeholder="(12) 99999-0000"></label>' +
          '<label>WhatsApp, se for outro número<input name="whatsapp" data-tel inputmode="tel" value="' + esc(t.whatsapp || "") + '"></label>' +
          '<label class="largo">Ponto<select name="ponto">' + opcoes + "</select></label>" +
        "</div>" +
        '<p class="erro" id="dlg-erro" hidden></p>' +
        '<div class="dlg-botoes">' +
          '<button type="button" class="botao botao-secundario" data-acao="fechar-dialogo">Cancelar</button>' +
          '<button type="submit" class="botao botao-primario">Confirmar</button>' +
        "</div>" +
      "</form>"
    );
    atualizarPreviewFoto();

    var form = document.getElementById("form-taxista");
    form.nome.addEventListener("input", atualizarPreviewFoto);
    document.getElementById("foto-arquivo").addEventListener("change", async function (e) {
      var arq = e.target.files && e.target.files[0];
      if (!arq) return;
      var info = document.getElementById("foto-info");
      info.textContent = "Processando foto…";
      try {
        estado.rascunho.fotoNova = await processarFoto(arq);
        info.textContent = "Foto pronta. Ela é enviada ao publicar.";
      } catch (err) {
        info.textContent = err.message;
      }
      atualizarPreviewFoto();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      aplicarTaxista(form);
    });
    form.nome.focus();
  }

  function atualizarPreviewFoto() {
    var r = estado.rascunho;
    var form = document.getElementById("form-taxista");
    if (!r || !form) return;
    var nome = form.nome.value;
    var prev = document.getElementById("foto-preview");
    var src = r.fotoNova || fotoSrc(r.foto);
    prev.innerHTML = src
      ? '<img class="foto grande" src="' + esc(src) + '" alt="" data-iniciais="' + esc(iniciais(nome)) + '">'
      : '<span class="foto foto-iniciais grande" aria-hidden="true">' + esc(iniciais(nome)) + "</span>";
    document.getElementById("remover-foto").hidden = !src;
  }

  function aplicarTaxista(form) {
    var r = estado.rascunho;
    var erro = document.getElementById("dlg-erro");
    var nome = txt(form.nome.value);
    var telefone = formatarTelefone(form.telefone.value);
    var whatsapp = form.whatsapp.value.trim() ? formatarTelefone(form.whatsapp.value) : "";

    var problemas = [];
    if (!nome) problemas.push("Preencha o nome.");
    if (!telefoneValido(telefone)) problemas.push("Telefone inválido. Use o DDD, ex.: (12) 99999-0000.");
    if (whatsapp && !telefoneValido(whatsapp)) problemas.push("Número de WhatsApp inválido.");
    if (problemas.length) {
      erro.textContent = problemas.join(" ");
      erro.hidden = false;
      return;
    }

    var foto = r.foto;
    if (r.fotoNova) {
      if (estado.fotosPendentes[foto]) delete estado.fotosPendentes[foto];
      foto = CONFIG.pastaFotos + "/" + (slug(nome) || "taxista") + "-" + Date.now().toString(36) + ".jpg";
      estado.fotosPendentes[foto] = r.fotoNova;
    } else if (!foto && r.foto && estado.fotosPendentes[r.foto]) {
      delete estado.fotosPendentes[r.foto];
    }

    var t = { nome: nome, carro: txt(form.carro.value), telefone: telefone, foto: foto };
    if (whatsapp) t.whatsapp = whatsapp;

    var destino = parseInt(form.ponto.value, 10);
    var pontos = estado.dados.pontos;
    if (r.idx >= 0 && destino === r.pontoIdx) {
      pontos[r.pontoIdx].taxistas[r.idx] = t;
    } else {
      if (r.idx >= 0) pontos[r.pontoIdx].taxistas.splice(r.idx, 1);
      pontos[destino].taxistas.push(t);
    }

    estado.rascunho = null;
    dialogo.close();
    estado.status = null;
    render();
  }

  function abrirToken(paraSalvar) {
    return new Promise(function (resolve) {
      var temToken = !!token();
      abrirDialogo(
        '<form class="dlg" id="form-token">' +
          "<h2>Conectar ao GitHub</h2>" +
          "<p>Para publicar, o painel precisa de um <strong>token do GitHub</strong> com permissão de escrita no repositório <strong>" + esc(CONFIG.repo) + "</strong>. " +
          "Você faz isso uma vez por navegador. O token fica guardado só neste navegador.</p>" +
          '<ol class="passos">' +
            '<li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> (logado na conta dona do repositório).</li>' +
            "<li>Dê um nome (ex.: <em>Painel TaxiCampos</em>) e escolha a validade.</li>" +
            "<li>Em <em>Repository access</em>, marque <em>Only select repositories</em> e escolha <em>TaxiCampos</em>.</li>" +
            "<li>Em <em>Permissions → Repository permissions → Contents</em>, escolha <em>Read and write</em>.</li>" +
            "<li>Clique em <em>Generate token</em>, copie e cole abaixo.</li>" +
          "</ol>" +
          '<label>Token<input name="token" type="password" autocomplete="off" spellcheck="false" placeholder="' + (temToken ? "Já conectado. Cole outro para trocar" : "github_pat_…") + '"></label>' +
          '<p class="erro" id="token-erro" hidden></p>' +
          '<div class="dlg-botoes">' +
            (temToken ? '<button type="button" class="botao-link esquerda" data-acao="esquecer-token">Desconectar</button>' : "") +
            '<button type="button" class="botao botao-secundario" data-acao="fechar-dialogo">Cancelar</button>' +
            '<button type="submit" class="botao botao-primario">' + (paraSalvar ? "Conectar e publicar" : "Conectar") + "</button>" +
          "</div>" +
        "</form>"
      );
      var form = document.getElementById("form-token");
      var erro = document.getElementById("token-erro");
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var t = form.token.value.trim();
        if (!t) { erro.textContent = "Cole o token."; erro.hidden = false; return; }
        erro.textContent = "Verificando…";
        erro.hidden = false;
        try {
          await gh("GET", "", null, t);
          gravarStorage("localStorage", CHAVE_TOKEN, t);
          dialogo.close("ok");
        } catch (err) {
          erro.textContent = err.status === 401 ? "Token inválido." :
            err.status === 404 ? "Esse token não tem acesso ao repositório " + CONFIG.repo + "." :
            mensagemErro(err);
        }
      });
      dialogo.addEventListener("close", function () {
        render();
        resolve(dialogo.returnValue === "ok");
      }, { once: true });
      dialogo.returnValue = "";
      form.token.focus();
    });
  }

  /* =========================================================
   * Ações
   * ========================================================= */

  function mover(lista, i, d) {
    var j = i + d;
    if (j < 0 || j >= lista.length) return;
    var x = lista[i]; lista[i] = lista[j]; lista[j] = x;
  }

  function proximoNumero() {
    var max = 0;
    estado.dados.pontos.forEach(function (p) {
      var n = parseInt(p.numero, 10);
      if (n > max) max = n;
    });
    var s = String(max + 1);
    return s.length < 2 ? "0" + s : s;
  }

  var acoes = {
    "inicio": function () { estado.tela = { tipo: "inicio", ponto: -1 }; render(); window.scrollTo(0, 0); },
    "abrir-ponto": function (b) { estado.tela = { tipo: "ponto", ponto: +b.dataset.i }; render(); window.scrollTo(0, 0); },
    "mover-ponto": function (b) { mover(estado.dados.pontos, +b.dataset.i, +b.dataset.d); estado.status = null; render(); },
    "excluir-ponto": function (b) {
      var i = +b.dataset.i, p = estado.dados.pontos[i];
      var n = p.taxistas.length;
      if (!window.confirm("Excluir “" + (p.nome || "ponto") + "”" + (n ? " e seus " + plural(n, "taxista", "taxistas") : "") + "?")) return;
      estado.dados.pontos.splice(i, 1);
      estado.tela = { tipo: "inicio", ponto: -1 };
      estado.status = null;
      render();
    },
    "novo-ponto": function () {
      estado.dados.pontos.push({ id: "", numero: proximoNumero(), nome: "", endereco: "", telefone: "", taxistas: [] });
      estado.tela = { tipo: "ponto", ponto: estado.dados.pontos.length - 1 };
      estado.status = null;
      render();
      var campo = document.querySelector('[data-campo="ponto.nome"]');
      if (campo) campo.focus();
    },
    "novo-taxista": function () { abrirTaxista(estado.tela.ponto, -1); },
    "editar-taxista": function (b) { abrirTaxista(estado.tela.ponto, +b.dataset.i); },
    "mover-taxista": function (b) {
      mover(estado.dados.pontos[estado.tela.ponto].taxistas, +b.dataset.i, +b.dataset.d);
      estado.status = null;
      render();
    },
    "excluir-taxista": function (b) {
      var lista = estado.dados.pontos[estado.tela.ponto].taxistas;
      var t = lista[+b.dataset.i];
      if (!window.confirm("Excluir “" + (t.nome || "taxista") + "”?")) return;
      if (estado.fotosPendentes[t.foto]) delete estado.fotosPendentes[t.foto];
      lista.splice(+b.dataset.i, 1);
      estado.status = null;
      render();
    },
    "remover-foto": function () {
      if (!estado.rascunho) return;
      estado.rascunho.foto = "";
      estado.rascunho.fotoNova = null;
      var arq = document.getElementById("foto-arquivo");
      if (arq) arq.value = "";
      atualizarPreviewFoto();
    },
    "fechar-dialogo": function () { estado.rascunho = null; dialogo.close(); },
    "github": function () { abrirToken(false); },
    "esquecer-token": function () {
      gravarStorage("localStorage", CHAVE_TOKEN, null);
      dialogo.close();
      definirStatus("Desconectado do GitHub neste navegador.", "info");
    },
    "salvar": salvar,
    "baixar": baixar,
    "sair": function () {
      if (estaSujo() && !window.confirm("Há alterações não publicadas. Sair mesmo assim?")) return;
      gravarStorage("sessionStorage", CHAVE_SESSAO, null);
      estado.dados = null;
      estado.fotosPendentes = {};
      estado.status = null;
      estado.tela = { tipo: "inicio", ponto: -1 };
      renderLogin();
    }
  };

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acao]");
    if (!b || b.disabled || !acoes[b.dataset.acao]) return;
    e.preventDefault();
    acoes[b.dataset.acao](b);
  });

  // Edição direta dos campos de configuração e do ponto
  document.addEventListener("input", function (e) {
    var campo = e.target.getAttribute && e.target.getAttribute("data-campo");
    if (!campo || !estado.dados) return;
    if (campo.indexOf("ponto.") === 0) {
      var p = estado.dados.pontos[estado.tela.ponto];
      if (p) p[campo.slice(6)] = e.target.value;
    } else {
      estado.dados[campo] = e.target.value;
    }
    estado.status = null;
    atualizarBarra();
  });

  // Formata telefones ao sair do campo
  document.addEventListener("focusout", function (e) {
    var el = e.target;
    if (!el.hasAttribute || !el.hasAttribute("data-tel") || !el.value.trim()) return;
    var f = formatarTelefone(el.value);
    if (f !== el.value) {
      el.value = f;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  // Foto que não carrega vira iniciais
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img.tagName !== "IMG" || !img.classList.contains("foto")) return;
    var span = document.createElement("span");
    span.className = img.className + " foto-iniciais";
    span.setAttribute("aria-hidden", "true");
    span.textContent = img.getAttribute("data-iniciais") || "?";
    img.replaceWith(span);
  }, true);

  window.addEventListener("beforeunload", function (e) {
    if (estaSujo()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- início ---------- */

  if (lerStorage("sessionStorage", CHAVE_SESSAO) === "1") carregarDados();
  else renderLogin();
})();
