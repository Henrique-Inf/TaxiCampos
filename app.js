(function () {
  "use strict";

  var dados = window.TAXI_DADOS || { pontos: [] };
  var app = document.getElementById("app");
  var subtitulo = document.getElementById("subtitulo");

  if (dados.cidade) subtitulo.textContent = "Contatos de táxi em " + dados.cidade;

  /* ---------- utilitários ---------- */

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
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
    var partes = String(nome || "?").trim().split(/\s+/);
    var ini = partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "");
    return ini.toUpperCase();
  }

  function plural(n, um, varios) {
    return n + " " + (n === 1 ? um : varios);
  }

  /* ---------- ícones ---------- */

  var ICONE_WHATS =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
  var ICONE_TEL =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>';
  var ICONE_SETA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z"/></svg>';

  /* ---------- componentes ---------- */

  function cartaoPonto(ponto) {
    var qtd = (ponto.taxistas || []).length;
    return (
      '<a class="ponto" href="#/ponto/' + encodeURIComponent(ponto.id) + '">' +
        '<span class="ponto-numero" aria-label="Ponto número ' + esc(ponto.numero) + '">' +
          '<small>Ponto</small>' + esc(ponto.numero) +
        "</span>" +
        '<span class="ponto-info">' +
          '<span class="ponto-nome">' + esc(ponto.nome) + "</span>" +
          (ponto.endereco ? '<span class="ponto-endereco">' + esc(ponto.endereco) + "</span>" : "") +
          '<span class="ponto-qtd">' + plural(qtd, "taxista", "taxistas") + "</span>" +
        "</span>" +
        '<span class="ponto-seta">' + ICONE_SETA + "</span>" +
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
        '<div class="taxista-topo">' +
          foto +
          '<div class="taxista-info">' +
            '<h3 class="taxista-nome">' + esc(t.nome) + "</h3>" +
            (t.carro ? '<p class="taxista-carro">🚗 ' + esc(t.carro) + "</p>" : "") +
            (t.telefone ? '<p class="taxista-tel">' + esc(t.telefone) + "</p>" : "") +
            (mostrarPonto && ponto
              ? '<p class="taxista-ponto"><a href="#/ponto/' + encodeURIComponent(ponto.id) + '">Ponto ' +
                esc(ponto.numero) + " · " + esc(ponto.nome) + "</a></p>"
              : "") +
          "</div>" +
        "</div>" +
        '<div class="acoes">' +
          (whats
            ? '<a class="botao botao-whats" href="' + esc(whats) + '" target="_blank" rel="noopener" ' +
              'aria-label="Chamar ' + esc(t.nome) + ' no WhatsApp">' + ICONE_WHATS + "<span>WhatsApp</span></a>"
            : "") +
          (tel
            ? '<a class="botao botao-ligar" href="' + esc(tel) + '" aria-label="Ligar para ' + esc(t.nome) + '">' +
              ICONE_TEL + "<span>Ligar</span></a>"
            : "") +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- telas ---------- */

  function telaInicio() {
    document.title = "TaxiCampos — Contatos de Táxi";
    app.innerHTML =
      '<div class="busca">' +
        '<label for="busca" class="sr-only">Buscar ponto, taxista ou carro</label>' +
        '<input id="busca" type="search" placeholder="Buscar ponto, taxista ou carro…" autocomplete="off">' +
      "</div>" +
      '<div id="resultados"></div>';

    var campo = document.getElementById("busca");
    var resultados = document.getElementById("resultados");

    function render() {
      var q = normalizar(campo.value.trim());
      var pontos = dados.pontos || [];

      if (!q) {
        resultados.innerHTML = pontos.length
          ? '<h2 class="titulo-secao">Pontos de táxi</h2><div class="lista-pontos">' +
            pontos.map(cartaoPonto).join("") + "</div>"
          : '<p class="vazio">Nenhum ponto cadastrado ainda.</p>';
        return;
      }

      var pontosAchados = pontos.filter(function (p) {
        return normalizar(p.nome + " " + p.numero + " " + (p.endereco || "")).indexOf(q) !== -1;
      });

      var taxistasAchados = [];
      pontos.forEach(function (p) {
        (p.taxistas || []).forEach(function (t) {
          if (normalizar(t.nome + " " + (t.carro || "")).indexOf(q) !== -1) {
            taxistasAchados.push({ t: t, p: p });
          }
        });
      });

      var html = "";
      if (pontosAchados.length) {
        html += '<h2 class="titulo-secao">Pontos</h2><div class="lista-pontos">' +
          pontosAchados.map(cartaoPonto).join("") + "</div>";
      }
      if (taxistasAchados.length) {
        html += '<h2 class="titulo-secao">Taxistas</h2><div class="lista-taxistas">' +
          taxistasAchados.map(function (x) { return cartaoTaxista(x.t, x.p, true); }).join("") + "</div>";
      }
      resultados.innerHTML = html || '<p class="vazio">Nada encontrado para “' + esc(campo.value) + '”.</p>';
    }

    campo.addEventListener("input", render);
    render();
  }

  function telaPonto(id) {
    var ponto = (dados.pontos || []).filter(function (p) { return String(p.id) === id; })[0];

    if (!ponto) {
      app.innerHTML =
        '<a class="voltar" href="#/">← Todos os pontos</a>' +
        '<p class="vazio">Ponto não encontrado.</p>';
      return;
    }

    document.title = ponto.nome + " — TaxiCampos";
    var taxistas = ponto.taxistas || [];
    var telPonto = linkLigar(ponto.telefone);

    app.innerHTML =
      '<a class="voltar" href="#/">← Todos os pontos</a>' +
      '<section class="cabecalho-ponto">' +
        '<span class="ponto-numero grande"><small>Ponto</small>' + esc(ponto.numero) + "</span>" +
        "<div>" +
          "<h1>" + esc(ponto.nome) + "</h1>" +
          (ponto.endereco ? '<p class="ponto-endereco">📍 ' + esc(ponto.endereco) + "</p>" : "") +
          (telPonto
            ? '<a class="botao botao-ligar pequeno" href="' + esc(telPonto) + '">' + ICONE_TEL +
              "<span>Ligar para o ponto · " + esc(ponto.telefone) + "</span></a>"
            : "") +
        "</div>" +
      "</section>" +
      '<h2 class="titulo-secao">' + plural(taxistas.length, "taxista", "taxistas") + "</h2>" +
      (taxistas.length
        ? '<div class="lista-taxistas">' +
          taxistas.map(function (t) { return cartaoTaxista(t, ponto, false); }).join("") + "</div>"
        : '<p class="vazio">Nenhum taxista cadastrado neste ponto.</p>');

    window.scrollTo(0, 0);
  }

  /* ---------- rotas ---------- */

  function rotear() {
    var hash = location.hash.replace(/^#\/?/, "");
    var m = hash.match(/^ponto\/(.+)$/);
    if (m) telaPonto(decodeURIComponent(m[1]));
    else telaInicio();
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

  window.addEventListener("hashchange", rotear);
  rotear();
})();
