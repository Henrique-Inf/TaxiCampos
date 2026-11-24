(function () {
  "use strict";

  var dados = window.TAXI_DADOS || { pontos: [] };
  var pontos = dados.pontos || [];
  var app = document.getElementById("app");

  /* ---------- utilitários ---------- */

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalizar(texto) {
    return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Converte "(12) 99999-0000" em "5512999990000" (formato internacional, só dígitos)
  function numeroInternacional(telefone) {
    var d = String(telefone || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.length === 8 || d.length === 9) d = (dados.dddPadrao || "") + d; // sem DDD
    if (d.length === 10 || d.length === 11) d = "55" + d;                 // sem código do país
    return d;
  }

  function linkLigar(telefone) {
    var n = numeroInternacional(telefone);
    return n ? "tel:+" + n : "";
  }

  function linkWhatsapp(taxista, ponto) {
    var n = numeroInternacional(taxista.whatsapp || taxista.telefone);
    if (!n) return "";
    var primeiroNome = String(taxista.nome || "").trim().split(/\s+/)[0];
    var msg = (dados.mensagemWhatsapp || "Olá, {nome}! Gostaria de solicitar uma corrida.")
      .replace(/\{nome\}/g, primeiroNome)
      .replace(/\{ponto\}/g, ponto ? ponto.nome : "");
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(msg);
  }

  function iniciais(nome) {
    var partes = String(nome || "?").replace(/\(.*?\)/g, "").trim().split(/\s+/);
    var ini = partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "");
    return ini.toUpperCase();
  }

  // "Ponto Capivari" → "Capivari"
  function nomeCurto(ponto) {
    return String(ponto.nome || "").replace(/^ponto\s+(d[aeo]s?\s+)?/i, "") || ponto.nome;
  }

  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  var totalTaxistas = pontos.reduce(function (s, p) { return s + (p.taxistas || []).length; }, 0);

  /* ---------- ícones ---------- */

  var ICONE_WHATS =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
  var ICONE_TEL =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>';
  var ICONE_SETA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICONE_BUSCA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21"/></svg>';

  /* ---------- componentes ---------- */

  function cartaoPonto(ponto) {
    var qtd = (ponto.taxistas || []).length;
    return (
      '<a class="ponto" href="#/ponto/' + encodeURIComponent(ponto.id) + '">' +
        '<span class="ponto__numero" aria-hidden="true">' + esc(ponto.numero) + "</span>" +
        '<span class="ponto__rotulo">Ponto ' + esc(ponto.numero) + "</span>" +
        "<div>" +
          '<h3 class="ponto__nome">' + esc(nomeCurto(ponto)) + "</h3>" +
          '<div class="ponto__rodape">' +
            "<span>" + plural(qtd, "taxista", "taxistas") + "</span>" +
            '<span class="ponto__seta">' + ICONE_SETA + "</span>" +
          "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function cartaoTaxista(t, ponto, mostrarPonto) {
    var foto = t.foto
      ? '<img class="foto" src="' + esc(t.foto) + '" alt="Foto de ' + esc(t.nome) + '" loading="lazy" ' +
        'data-iniciais="' + esc(iniciais(t.nome)) + '">'
      : '<span class="foto foto-iniciais" aria-hidden="true">' + esc(iniciais(t.nome)) + "</span>";

    var whats = linkWhatsapp(t, ponto);
    var tel = linkLigar(t.telefone);

    return (
      '<article class="taxista">' +
        '<div class="taxista__topo">' +
          foto +
          '<div class="taxista__info">' +
            '<h3 class="taxista__nome">' + esc(t.nome) + "</h3>" +
            (t.carro ? '<p class="taxista__carro">' + esc(t.carro) + "</p>" : "") +
            (t.telefone ? '<p class="taxista__tel">' + esc(t.telefone) + "</p>" : "") +
            (mostrarPonto && ponto
              ? '<p class="taxista__ponto"><a href="#/ponto/' + encodeURIComponent(ponto.id) + '">Ponto ' +
                esc(ponto.numero) + " · " + esc(nomeCurto(ponto)) + "</a></p>"
              : "") +
          "</div>" +
        "</div>" +
        '<div class="acoes">' +
          (whats
            ? '<a class="btn btn--whats" href="' + esc(whats) + '" target="_blank" rel="noopener" ' +
              'aria-label="Chamar ' + esc(t.nome) + ' no WhatsApp">' + ICONE_WHATS + "<span>WhatsApp</span></a>"
            : "") +
          (tel
            ? '<a class="btn btn--amarelo" href="' + esc(tel) + '" aria-label="Ligar para ' + esc(t.nome) + '">' +
              ICONE_TEL + "<span>Ligar</span></a>"
            : "") +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- telas ---------- */

  function telaInicio() {
    document.title = "TaxiCampos — Táxi em " + (dados.cidade || "Campos do Jordão");

    app.innerHTML =
      '<section class="capa">' +
        '<div class="capa__foto" aria-hidden="true"></div>' +
        '<h1 class="display capa__titulo"><span>Taxi</span><span class="amarelo">Campos</span></h1>' +
        '<div class="capa__rodape">' +
          '<p class="capa__texto">Os taxistas de ' + esc(dados.cidade || "Campos do Jordão") +
            ", ponto por ponto. Chame no WhatsApp ou ligue direto.</p>" +
          '<div class="capa__acoes">' +
            '<a class="btn btn--amarelo" href="#/" data-rolar="pontos">Ver os pontos ' + ICONE_SETA + "</a>" +
            '<a class="btn btn--fantasma" href="#/" data-rolar="busca">Buscar taxista</a>' +
          "</div>" +
        "</div>" +
        '<p class="capa__dica">' + plural(pontos.length, "ponto", "pontos") + " · " +
          plural(totalTaxistas, "taxista", "taxistas") + "</p>" +
      "</section>" +

      '<div class="xadrez" aria-hidden="true"></div>' +

      '<section class="secao" id="pontos">' +
        '<div class="secao__topo">' +
          '<h2 class="display secao__titulo"><span class="rotulo">Escolha o mais perto</span>Pontos de <span class="amarelo">táxi</span></h2>' +
          '<div class="busca">' +
            ICONE_BUSCA +
            '<label for="busca" class="sr-only">Buscar ponto, taxista ou carro</label>' +
            '<input id="busca" type="search" placeholder="Buscar ponto, taxista ou carro" autocomplete="off">' +
          "</div>" +
        "</div>" +
        '<div id="resultados"></div>' +
      "</section>" +

      '<section class="faixa">' +
        '<div class="faixa__conteudo">' +
          '<h2 class="display faixa__titulo">A serra toda<br>num toque</h2>' +
          '<p class="faixa__texto">Do Capivari ao Jaguaribe, da Rodoviária ao Pão de Açúcar: tem sempre um táxi perto de você.</p>' +
        "</div>" +
      "</section>" +

      '<section class="secao claro">' +
        '<p class="manifesto">Taxista de confiança, que conhece a cidade. <span>Sem aplicativo, sem cadastro: é só chamar.</span></p>' +
        '<ol class="passos">' +
          "<li><b>1</b><h3>Escolha o ponto</h3><p>Veja os pontos de táxi da cidade e abra o mais perto de onde você está.</p></li>" +
          "<li><b>2</b><h3>Escolha o taxista</h3><p>Cada ponto mostra os taxistas que trabalham ali, com nome e telefone.</p></li>" +
          "<li><b>3</b><h3>Chame</h3><p>Toque no WhatsApp e a mensagem já vai pronta. Ou ligue direto.</p></li>" +
        "</ol>" +
      "</section>";

    var campo = document.getElementById("busca");
    var resultados = document.getElementById("resultados");

    function render() {
      var q = normalizar(campo.value.trim());

      if (!q) {
        resultados.innerHTML = pontos.length
          ? '<div class="grade-pontos">' + pontos.map(cartaoPonto).join("") + "</div>"
          : '<p class="vazio">Nenhum ponto cadastrado ainda.</p>';
        return;
      }

      var pontosAchados = pontos.filter(function (p) {
        return normalizar(p.nome + " " + p.numero + " " + (p.endereco || "")).indexOf(q) !== -1;
      });

      var taxistasAchados = [];
      pontos.forEach(function (p) {
        (p.taxistas || []).forEach(function (t) {
          if (normalizar(t.nome + " " + (t.carro || "")).indexOf(q) !== -1) taxistasAchados.push({ t: t, p: p });
        });
      });

      var html = "";
      if (pontosAchados.length) {
        html += '<p class="subtitulo-lista">Pontos</p><div class="grade-pontos">' +
          pontosAchados.map(cartaoPonto).join("") + "</div>";
      }
      if (taxistasAchados.length) {
        html += '<p class="subtitulo-lista">' + plural(taxistasAchados.length, "taxista", "taxistas") + '</p><div class="grade-taxistas">' +
          taxistasAchados.map(function (x) { return cartaoTaxista(x.t, x.p, true); }).join("") + "</div>";
      }
      resultados.innerHTML = html || '<p class="vazio">Nada encontrado para “' + esc(campo.value) + "”.</p>";
    }

    campo.addEventListener("input", render);
    render();
  }

  function telaPonto(id) {
    var ponto = pontos.filter(function (p) { return String(p.id) === id; })[0];

    if (!ponto) {
      app.innerHTML =
        '<section class="topo-ponto"><a class="voltar" href="#/">' + ICONE_SETA + "Todos os pontos</a>" +
        '<h1 class="display topo-ponto__nome">Ponto não encontrado</h1></section>';
      return;
    }

    document.title = ponto.nome + " — TaxiCampos";
    var taxistas = ponto.taxistas || [];
    var telPonto = linkLigar(ponto.telefone);

    app.innerHTML =
      '<section class="topo-ponto">' +
        '<a class="voltar" href="#/" data-rolar="pontos">' + ICONE_SETA + "Todos os pontos</a>" +
        '<p class="topo-ponto__rotulo">Ponto <b>' + esc(ponto.numero) + "</b></p>" +
        '<h1 class="display topo-ponto__nome">' + esc(nomeCurto(ponto)) + "</h1>" +
        '<div class="topo-ponto__info">' +
          "<span><strong>" + plural(taxistas.length, "taxista", "taxistas") + "</strong></span>" +
          (ponto.endereco ? "<span>" + esc(ponto.endereco) + "</span>" : "") +
          (telPonto
            ? '<a class="btn btn--fantasma" href="' + esc(telPonto) + '">' + ICONE_TEL +
              "<span>Ligar para o ponto · " + esc(ponto.telefone) + "</span></a>"
            : "") +
        "</div>" +
      "</section>" +
      '<div class="xadrez xadrez--fina" aria-hidden="true"></div>' +
      '<section class="secao">' +
        (taxistas.length
          ? '<div class="grade-taxistas">' +
            taxistas.map(function (t) { return cartaoTaxista(t, ponto, false); }).join("") + "</div>"
          : '<p class="vazio">Nenhum taxista cadastrado neste ponto.</p>') +
      "</section>";
  }

  /* ---------- rotas e rolagem ---------- */

  var rolarPara = null;

  function rotear() {
    var hash = location.hash.replace(/^#\/?/, "");
    var m = hash.match(/^ponto\/(.+)$/);
    if (m) telaPonto(decodeURIComponent(m[1]));
    else telaInicio();

    if (rolarPara) rotearRolagem();
    else window.scrollTo(0, 0);
  }

  // Links "Ver os pontos", "Buscar taxista" e "Todos os pontos" rolam até a seção certa
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-rolar]");
    if (!link) return;
    e.preventDefault();
    rolarPara = link.getAttribute("data-rolar");
    if (location.hash.replace(/^#\/?/, "") === "") rotearRolagem();
    else location.hash = "#/";
  });

  function rotearRolagem() {
    var alvo = document.getElementById(rolarPara);
    rolarPara = null;
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: "smooth", block: alvo.id === "busca" ? "center" : "start" });
    if (alvo.id === "busca") alvo.focus({ preventScroll: true });
  }

  // Se a foto não carregar, mostra as iniciais no lugar
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img.tagName !== "IMG" || !img.classList.contains("foto")) return;
    var span = document.createElement("span");
    span.className = "foto foto-iniciais";
    span.setAttribute("aria-hidden", "true");
    span.textContent = img.getAttribute("data-iniciais") || "?";
    img.replaceWith(span);
  }, true);

  // Textos fixos do topo e do rodapé
  var cidade = dados.cidade || "Campos do Jordão";
  var selo = document.getElementById("selo-texto");
  if (selo) selo.textContent = plural(totalTaxistas, "taxista", "taxistas") + " em " + cidade;
  var rodapeCidade = document.getElementById("rodape-cidade");
  if (rodapeCidade) rodapeCidade.textContent = cidade;

  window.addEventListener("hashchange", rotear);
  rotear();
})();
