(function () {
  "use strict";

  var dados = window.TAXI_DADOS || { pontos: [] };
  var pontos = dados.pontos || [];

  /* ---------- ordem dos taxistas ----------
   * Toda vez que um ponto é aberto, a lista de taxistas é embaralhada,
   * para ninguém ficar sempre no topo.
   */

  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = copia[i]; copia[i] = copia[j]; copia[j] = x;
    }
    return copia;
  }
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
    var partes = String(nome || "").replace(/\(.*?\)/g, " ").split(/\s+/)
      .filter(function (p) { return /^\p{L}/u.test(p); });
    if (!partes.length) return "?";
    var ini = partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "");
    return ini.toUpperCase();
  }

  // "Ponto Capivari" → "Capivari"
  function nomeCurto(ponto) {
    return String(ponto.nome || "").replace(/^ponto\s+(d[aeo]s?\s+)?/i, "") || ponto.nome;
  }

  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  var apoiadores = (dados.apoiadores || []).filter(function (a) { return a && a.nome; });

  var regiaoAtiva = null; // null = ordem normal, "perto" = ordenado pela distância

  /* ---------- mapa e distância ---------- */

  function coordsDe(p) {
    var lat = parseFloat(String(p.lat == null ? "" : p.lat).replace(",", "."));
    var lng = parseFloat(String(p.lng == null ? "" : p.lng).replace(",", "."));
    return isFinite(lat) && isFinite(lng) ? { lat: lat, lng: lng } : null;
  }
  var temCoords = pontos.some(coordsDe);
  var minhaPosicao = null;
  var modoMapa = false; // true = pontos mostrados no mapa em vez da lista

  /* ---------- mapa dos pontos (Leaflet + OpenStreetMap) ---------- */

  var mapaAtual = null;
  var leafletPronto = null;

  function carregarLeaflet() {
    if (window.L && window.L.markerClusterGroup) return Promise.resolve();
    if (!leafletPronto) {
      ["vendor/leaflet/leaflet.css", "vendor/leaflet/MarkerCluster.css"].forEach(function (href) {
        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = href;
        document.head.appendChild(css);
      });
      // o agrupador de alfinetes precisa do Leaflet carregado antes
      leafletPronto = carregarScript("vendor/leaflet/leaflet.js").then(function () {
        return carregarScript("vendor/leaflet/leaflet.markercluster.js");
      });
    }
    return leafletPronto;
  }

  function popupPonto(p) {
    var qtd = (p.taxistas || []).length;
    var chegar = linkComoChegar(p);
    return (
      '<div class="popup-ponto__rotulo">Ponto ' + esc(p.numero) + (regiaoDe(p) ? " · " + esc(regiaoDe(p)) : "") + "</div>" +
      '<div class="popup-ponto__nome">' + esc(nomeCurto(p)) + "</div>" +
      '<div class="popup-ponto__qtd">' + plural(qtd, "taxista", "taxistas") + "</div>" +
      '<div class="popup-ponto__acoes">' +
        '<a class="btn btn--amarelo" href="#/ponto/' + encodeURIComponent(p.id) + '">Ver taxistas</a>' +
        (chegar ? '<a class="btn btn--fantasma" href="' + esc(chegar) + '" target="_blank" rel="noopener">Como chegar</a>' : "") +
      "</div>"
    );
  }

  function desenharMapa(el) {
    if (mapaAtual) { mapaAtual.remove(); mapaAtual = null; }
    el.innerHTML = '<p class="mapa__carregando">Carregando mapa…</p>';
    carregarLeaflet().then(function () {
      if (!document.body.contains(el)) return; // a tela mudou enquanto carregava
      el.innerHTML = "";
      var L = window.L;
      var mapa = L.map(el, { scrollWheelZoom: false, zoomControl: true });
      mapaAtual = mapa;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(mapa);

      // pontos muito próximos viram uma bolinha com a quantidade; tocando, o mapa aproxima
      var grupo = L.markerClusterGroup({
        maxClusterRadius: 38,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: function (cluster) {
          var n = cluster.getChildCount();
          return L.divIcon({
            className: "grupo-pinos",
            html: "<span><b>" + n + "</b><small>pontos</small></span>",
            iconSize: [52, 52]
          });
        }
      });

      var limites = [];
      pontos.forEach(function (p) {
        var c = coordsDe(p);
        if (!c) return;
        var icone = L.divIcon({
          className: "pino",
          html: "<span><b>" + esc(p.numero) + "</b></span>",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32]
        });
        L.marker([c.lat, c.lng], { icon: icone, title: "Ponto " + p.numero + " · " + nomeCurto(p), alt: nomeCurto(p) })
          .addTo(grupo)
          .bindPopup(popupPonto(p), { className: "popup-ponto", maxWidth: 260, minWidth: 210 });
        limites.push([c.lat, c.lng]);
      });

      if (minhaPosicao) {
        L.circleMarker([minhaPosicao.lat, minhaPosicao.lng], {
          radius: 8, color: "#ffffff", weight: 3, fillColor: "#2F80ED", fillOpacity: 1
        }).addTo(mapa).bindTooltip("Você está aqui");
        limites.push([minhaPosicao.lat, minhaPosicao.lng]);
      }

      // primeiro enquadra todos os pontos, depois coloca os alfinetes (o agrupador precisa do zoom definido)
      function enquadrar() {
        mapa.invalidateSize();
        if (limites.length) mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 });
        else mapa.setView([-22.733, -45.584], 14);
      }
      enquadrar();
      mapa.addLayer(grupo);
      // se a área do mapa mudar de tamanho logo depois de aparecer, enquadra de novo
      setTimeout(enquadrar, 250);
    }, function () {
      el.innerHTML = '<p class="mapa__carregando">Não consegui carregar o mapa. Confira a internet e tente de novo.</p>';
    });
  }
  var avisoLocal = "";

  function linkComoChegar(p) {
    var c = coordsDe(p);
    if (p.mapa) return linkSeguro(p.mapa);
    if (c) return "https://www.google.com/maps/dir/?api=1&destination=" + c.lat + "," + c.lng;
    if (p.endereco) {
      return "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(p.endereco + ", " + (dados.cidade || "Campos do Jordão") + " - SP");
    }
    return "";
  }

  function distanciaKm(a, b) {
    var r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function textoDistancia(km) {
    if (km < 1) return "a " + Math.max(50, Math.round(km * 1000 / 50) * 50) + " m";
    return "a " + (km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)) + " km";
  }

  var totalTaxistas = pontos.reduce(function (s, p) { return s + (p.taxistas || []).length; }, 0);

  /* ---------- ícones ---------- */

  var ICONE_WHATS =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
  var ICONE_TEL =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>';
  var ICONE_SETA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICONE_MAPA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11v13.5"/></svg>';
  var ICONE_LISTA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>';
  var ICONE_PINO =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';
  var ICONE_BUSCA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21"/></svg>';

  /* ---------- componentes ---------- */

  function regiaoDe(ponto) { return String(ponto.regiao || "").trim(); }

  function cartaoPonto(ponto, distancia) {
    var qtd = (ponto.taxistas || []).length;
    var regiao = regiaoDe(ponto);
    return (
      '<a class="ponto" href="#/ponto/' + encodeURIComponent(ponto.id) + '">' +
        '<span class="ponto__numero" aria-hidden="true">' + esc(ponto.numero) + "</span>" +
        '<span class="ponto__topo">' +
          '<span class="ponto__rotulo">Ponto ' + esc(ponto.numero) + "</span>" +
          (regiao ? '<span class="ponto__bairro">' + ICONE_PINO + esc(regiao) + "</span>" : "") +
          (distancia != null ? '<span class="ponto__distancia">' + ICONE_PINO + textoDistancia(distancia) + "</span>" : "") +
        "</span>" +
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
            '<p class="taxista__carro"><span>Carro:</span> ' + esc(t.carro || "") + "</p>" +
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

  function linkSeguro(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return url;
  }

  function logoApoiador(a) {
    return a.logo
      ? '<img src="' + esc(a.logo) + '" alt="' + esc(a.nome) + '" loading="lazy" data-nome="' + esc(a.nome) + '">'
      : '<span class="logo-nome">' + esc(a.nome) + "</span>";
  }

  function cartaoApoiador(a) {
    var site = linkSeguro(a.site);
    var abre = site
      ? '<a class="apoiador" href="' + esc(site) + '" target="_blank" rel="noopener">'
      : '<div class="apoiador">';
    return (
      abre +
        '<div class="apoiador__logo">' + logoApoiador(a) + "</div>" +
        '<div class="apoiador__info">' +
          '<h3 class="apoiador__nome">' + esc(a.nome) + "</h3>" +
          (a.descricao ? '<p class="apoiador__descricao">' + esc(a.descricao) + "</p>" : "") +
          (site ? '<span class="apoiador__link">Visitar ' + ICONE_SETA + "</span>" : "") +
        "</div>" +
      (site ? "</a>" : "</div>")
    );
  }

  // Quadradinhos "Tenha sua empresa aqui", que abrem o WhatsApp de quem cuida do site
  function linkSerApoiador() {
    var c = dados.contatoApoio || {};
    var n = numeroInternacional(c.whatsapp);
    if (!n) return "";
    var msg = c.mensagem || "Olá! Vi o site TaxiCampos e gostaria de saber como minha empresa pode ser apoiadora do site.";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(msg);
  }

  // Quantas vagas mostrar: completa a grade (múltiplo de "colunas"), com pelo menos "minimo" vagas
  function quantasVagas(total, alvo, minimo, colunas) {
    var v = Math.max(alvo - total, minimo);
    while ((total + v) % colunas) v++;
    return v;
  }

  var ICONE_MAIS =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>';

  function vagasPagina(qtd) {
    var link = linkSerApoiador();
    var html = "";
    for (var i = 0; i < qtd; i++) {
      html += (link ? '<a class="apoiador vaga" href="' + esc(link) + '" target="_blank" rel="noopener">' : '<div class="apoiador vaga">') +
        '<div class="apoiador__logo vaga__logo">' + ICONE_MAIS + "</div>" +
        '<div class="apoiador__info">' +
          '<h3 class="apoiador__nome">Tenha sua empresa aqui</h3>' +
          '<p class="apoiador__descricao">Apoie o site e apareça para quem procura táxi em ' + esc(dados.cidade || "Campos do Jordão") + ".</p>" +
          (link ? '<span class="apoiador__link">Falar no WhatsApp ' + ICONE_SETA + "</span>" : "") +
        "</div>" +
      (link ? "</a>" : "</div>");
    }
    return html;
  }

  function vagasRodape(qtd) {
    var link = linkSerApoiador();
    var html = "";
    for (var i = 0; i < qtd; i++) {
      html += (link ? '<a class="rodape__logo vaga" href="' + esc(link) + '" target="_blank" rel="noopener">' : '<div class="rodape__logo vaga">') +
        ICONE_MAIS + "<span>Tenha sua empresa aqui</span>" + (link ? "</a>" : "</div>");
    }
    return html;
  }

  function renderRodape(mostrar) {
    var rodape = document.getElementById("rodape");
    if (!rodape) return;
    if (!mostrar) { rodape.hidden = true; rodape.innerHTML = ""; return; }
    rodape.hidden = false;
    var logos = apoiadores.map(function (a) {
          var site = linkSeguro(a.site);
          return site
            ? '<a class="rodape__logo" href="' + esc(site) + '" target="_blank" rel="noopener" title="' + esc(a.nome) + '">' + logoApoiador(a) + "</a>"
            : '<div class="rodape__logo" title="' + esc(a.nome) + '">' + logoApoiador(a) + "</div>";
        }).join("") +
      vagasRodape(quantasVagas(apoiadores.length, 6, 1, 2));
    rodape.innerHTML =
      '<div class="rodape__topo">' +
        '<p class="rotulo">Apoiadores do site</p>' +
        '<a class="rodape__ver" href="#/apoiadores">Ver todos ' + ICONE_SETA + "</a>" +
      "</div>" +
      '<div class="rodape__logos">' + logos + "</div>";
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
            '<label for="busca" class="sr-only">Buscar ponto, bairro, taxista ou carro</label>' +
            '<input id="busca" type="search" placeholder="Buscar ponto, bairro ou taxista" autocomplete="off">' +
          "</div>" +
        "</div>" +
        '<div id="resultados"></div>' +
      "</section>" +

      '<section class="faixa">' +
        '<div class="faixa__conteudo">' +
          '<h2 class="display faixa__titulo">A serra toda<br>num toque</h2>' +
          '<p class="faixa__texto">Da Abernéssia ao Capivari, sempre tem um táxi perto de você. É só escolher o ponto e chamar.</p>' +
        "</div>" +
      "</section>" +

      '<section class="secao claro">' +
        '<p class="manifesto">Taxistas licenciados, regularizados e experientes, que conhecem cada canto da cidade. Não precisa de aplicativo nem cadastro, é só chamar.</p>' +
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
        if (!pontos.length) {
          resultados.innerHTML = '<p class="vazio">Nenhum ponto cadastrado ainda.</p>';
        } else {
          var filtros = temCoords
            ? '<div class="filtros" role="group" aria-label="Ordenar pontos">' +
                '<button type="button" class="filtro filtro--perto" data-regiao="perto" aria-pressed="' + (regiaoAtiva === "perto") + '">' +
                  ICONE_PINO + (regiaoAtiva === "localizando" ? "Localizando…" : "Perto de mim") + "</button>" +
                '<button type="button" class="filtro" data-regiao="" aria-pressed="' + (regiaoAtiva !== "perto") + '">Todos</button>' +
                '<button type="button" class="filtro filtro--mapa" data-mapa>' +
                  (modoMapa ? ICONE_LISTA + "Ver lista" : ICONE_MAPA + "Ver no mapa") + "</button>" +
              "</div>" +
              (avisoLocal ? '<p class="aviso-local">' + esc(avisoLocal) + "</p>" : "")
            : "";

          var lista = pontos.map(function (p) { return { p: p, d: null }; });
          if (regiaoAtiva === "perto" && minhaPosicao) {
            lista = pontos.map(function (p) {
              var c = coordsDe(p);
              return { p: p, d: c ? distanciaKm(minhaPosicao, c) : null };
            }).sort(function (x, y) {
              if (x.d == null) return 1;
              if (y.d == null) return -1;
              return x.d - y.d;
            });
          }
          if (modoMapa && temCoords) {
            resultados.innerHTML = filtros +
              '<div class="mapa" id="mapa-pontos" role="region" aria-label="Mapa dos pontos de táxi"></div>';
            desenharMapa(document.getElementById("mapa-pontos"));
          } else {
            resultados.innerHTML = filtros + '<div class="grade-pontos">' +
              lista.map(function (x) { return cartaoPonto(x.p, x.d); }).join("") + "</div>";
          }
        }
        return;
      }

      var pontosAchados = pontos.filter(function (p) {
        return normalizar(p.nome + " " + p.numero + " " + (p.endereco || "") + " " + regiaoDe(p)).indexOf(q) !== -1;
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
          pontosAchados.map(function (p) { return cartaoPonto(p); }).join("") + "</div>";
      }
      if (taxistasAchados.length) {
        html += '<p class="subtitulo-lista">' + plural(taxistasAchados.length, "taxista", "taxistas") + '</p><div class="grade-taxistas">' +
          taxistasAchados.map(function (x) { return cartaoTaxista(x.t, x.p, true); }).join("") + "</div>";
      }
      resultados.innerHTML = html || '<p class="vazio">Nada encontrado para “' + esc(campo.value) + "”.</p>";
    }

    campo.addEventListener("input", render);
    resultados.addEventListener("click", function (e) {
      var botao = e.target.closest(".filtro");
      if (!botao) return;
      if (botao.hasAttribute("data-mapa")) {
        modoMapa = !modoMapa;
        render();
        var secao = document.getElementById("pontos");
        if (modoMapa && secao) secao.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var r = botao.getAttribute("data-regiao");
      avisoLocal = "";
      if (r !== "perto") { regiaoAtiva = r ? r : null; render(); return; }
      if (minhaPosicao) { regiaoAtiva = "perto"; render(); return; }
      if (!navigator.geolocation) {
        avisoLocal = "Seu navegador não informa a localização. Escolha o ponto pelo bairro.";
        render();
        return;
      }
      regiaoAtiva = "localizando";
      render();
      navigator.geolocation.getCurrentPosition(function (pos) {
        minhaPosicao = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        regiaoAtiva = "perto";
        render();
      }, function () {
        regiaoAtiva = null;
        avisoLocal = "Não consegui pegar sua localização. Confira se o navegador tem permissão de localização e tente de novo.";
        render();
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
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
    var taxistas = embaralhar(ponto.taxistas || []);
    var telPonto = linkLigar(ponto.telefone);

    app.innerHTML =
      '<section class="topo-ponto">' +
        '<a class="voltar" href="#/" data-rolar="pontos">' + ICONE_SETA + "Todos os pontos</a>" +
        '<p class="topo-ponto__rotulo">Ponto <b>' + esc(ponto.numero) + "</b>" +
          (regiaoDe(ponto) ? '<span class="topo-ponto__regiao">' + ICONE_PINO + esc(regiaoDe(ponto)) + "</span>" : "") +
        "</p>" +
        '<h1 class="display topo-ponto__nome">' + esc(nomeCurto(ponto)) + "</h1>" +
        '<div class="topo-ponto__info">' +
          "<span><strong>" + plural(taxistas.length, "taxista", "taxistas") + "</strong></span>" +
          (ponto.endereco ? "<span>" + esc(ponto.endereco) + "</span>" : "") +
          (linkComoChegar(ponto)
            ? '<a class="btn btn--fantasma" href="' + esc(linkComoChegar(ponto)) + '" target="_blank" rel="noopener">' +
              ICONE_PINO + "<span>Como chegar</span></a>"
            : "") +
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

  function telaApoiadores() {
    document.title = "Apoiadores — TaxiCampos";
    app.innerHTML =
      '<section class="topo-simples">' +
        '<a class="voltar" href="#/">' + ICONE_SETA + "Início</a>" +
        '<p class="rotulo">Quem apoia o site</p>' +
        '<h1 class="display topo-simples__titulo">Apoia<span class="amarelo">dores</span></h1>' +
        '<p class="topo-simples__texto">Estas empresas apoiam o <strong>site TaxiCampos</strong>: ajudam a mantê-lo no ar e gratuito para todo mundo.</p>' +
        '<p class="aviso-apoio">Os apoiadores não têm ligação com os taxistas nem com as corridas. ' +
          "Valores, combinados e atendimento são tratados direto com cada taxista.</p>" +
      "</section>" +
      '<div class="xadrez xadrez--fina" aria-hidden="true"></div>' +
      '<section class="secao">' +
        '<div class="grade-apoiadores">' +
          apoiadores.map(cartaoApoiador).join("") +
          vagasPagina(quantasVagas(apoiadores.length, 6, 2, 3)) +
        "</div>" +
      "</section>";
  }

  /* ---------- pagamento da mensalidade (página sem link: #/pagamento) ---------- */

  // Remove acentos e caracteres fora do padrão do Pix, e corta no tamanho máximo
  function textoPix(texto, max) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9 .,@_\-]/g, "").trim().slice(0, max);
  }

  function campoPix(id, valor) {
    var tam = String(valor.length);
    return id + (tam.length < 2 ? "0" + tam : tam) + valor;
  }

  function crc16(texto) { // CRC16-CCITT (0x1021, início 0xFFFF), exigido pelo padrão do Pix
    var crc = 0xFFFF;
    for (var i = 0; i < texto.length; i++) {
      crc ^= texto.charCodeAt(i) << 8;
      for (var b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ("0000" + crc.toString(16).toUpperCase()).slice(-4);
  }

  // Monta o "Pix copia e cola" (BR Code estático do Banco Central)
  function codigoPix(cfg) {
    var conta = campoPix("00", "br.gov.bcb.pix") + campoPix("01", String(cfg.chavePix).trim());
    var desc = textoPix(cfg.descricao, 40);
    if (desc) conta += campoPix("02", desc);
    var valor = (parseFloat(String(cfg.valor).replace(",", ".")) || 0).toFixed(2);
    var corpo =
      campoPix("00", "01") +
      campoPix("26", conta) +
      campoPix("52", "0000") +
      campoPix("53", "986") +
      (parseFloat(valor) > 0 ? campoPix("54", valor) : "") +
      campoPix("58", "BR") +
      campoPix("59", textoPix(cfg.nomeRecebedor || "TaxiCampos", 25) || "TaxiCampos") +
      campoPix("60", textoPix(cfg.cidadeRecebedor || "Campos do Jordao", 15) || "Campos do Jordao") +
      campoPix("62", campoPix("05", textoPix(cfg.identificador, 25).replace(/[^A-Za-z0-9]/g, "") || "TAXICAMPOS")) +
      "6304";
    return corpo + crc16(corpo);
  }

  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    return new Promise(function (ok, erro) {
      var campo = document.createElement("textarea");
      campo.value = texto;
      campo.setAttribute("readonly", "");
      campo.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(campo);
      campo.select();
      try { document.execCommand("copy") ? ok() : erro(); } catch (e) { erro(e); }
      campo.remove();
    });
  }

  function carregarScript(src) {
    return new Promise(function (ok, erro) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = erro;
      document.head.appendChild(s);
    });
  }

  // paraApoiador = true → página #/apoiador (apoio anual das empresas); senão, mensalidade dos taxistas
  function telaPagamento(paraApoiador) {
    var cfg = {};
    var base = dados.pagamento || {};
    var extra = paraApoiador ? (dados.pagamentoApoiador || {}) : {};
    for (var k in base) cfg[k] = base[k];
    for (var k2 in extra) cfg[k2] = extra[k2];
    var periodo = paraApoiador ? "ano" : "mês";
    document.title = (paraApoiador ? "Apoio anual" : "Mensalidade") + " — TaxiCampos";
    if (!cfg.chavePix) {
      app.innerHTML = '<section class="topo-simples"><h1 class="display topo-simples__titulo">Pagamento</h1>' +
        '<p class="topo-simples__texto">A chave Pix ainda não foi configurada.</p></section>';
      return;
    }
    var codigo = codigoPix(cfg);
    var valorTexto = "R$ " + (parseFloat(String(cfg.valor).replace(",", ".")) || 0).toFixed(2).replace(".", ",");

    var opcoes = paraApoiador ? "" : '<option value="">Escolha seu nome</option>' + pontos.map(function (p) {
      var nomes = (p.taxistas || []).slice().sort(function (x, y) { return x.nome.localeCompare(y.nome, "pt-BR"); });
      return '<optgroup label="' + esc("Ponto " + p.numero + " · " + nomeCurto(p)) + '">' +
        nomes.map(function (t) {
          return '<option value="' + esc(t.nome + "|" + p.nome) + '">' + esc(t.nome) + "</option>";
        }).join("") + "</optgroup>";
    }).join("");

    app.innerHTML =
      '<section class="topo-simples">' +
        (paraApoiador
          ? '<p class="rotulo">Área do apoiador</p>' +
            '<h1 class="display topo-simples__titulo">Apoio <span class="amarelo">anual</span></h1>' +
            '<p class="topo-simples__texto">' + esc(valorTexto) + " por ano para ter sua empresa na página de apoiadores e no rodapé do TaxiCampos. " +
              "Pague pelo Pix e mande o comprovante pelo WhatsApp.</p>"
          : '<p class="rotulo">Área do taxista</p>' +
            '<h1 class="display topo-simples__titulo">Mensa<span class="amarelo">lidade</span></h1>' +
            '<p class="topo-simples__texto">' + esc(valorTexto) + " por mês para manter seu contato no TaxiCampos. " +
              "Pague pelo Pix e mande o comprovante pelo WhatsApp.</p>") +
      "</section>" +
      '<div class="xadrez xadrez--fina" aria-hidden="true"></div>' +
      '<section class="secao pagamento">' +
        '<div class="pix">' +
          '<div class="pix__qr" id="pix-qr" aria-label="QR Code do Pix"></div>' +
          '<div class="pix__info">' +
            '<p class="pix__valor">' + esc(valorTexto) + "<span>/" + periodo + "</span></p>" +
            '<ol class="pix__passos">' +
              "<li>Abra o app do seu banco e vá em <strong>Pix</strong>.</li>" +
              "<li>Escolha <strong>Ler QR Code</strong> ou <strong>Pix copia e cola</strong>.</li>" +
              "<li>Confira o valor e o nome de quem recebe, e confirme.</li>" +
            "</ol>" +
            '<button type="button" class="btn btn--amarelo" id="copiar-codigo">Copiar código Pix</button>' +
            '<p class="pix__chave">Chave Pix (e-mail): <strong>' + esc(cfg.chavePix) + "</strong> " +
              '<button type="button" class="pix__copiar" id="copiar-chave">copiar</button></p>' +
            '<p class="pix__aviso" id="pix-aviso" role="status"></p>' +
          "</div>" +
        "</div>" +
        '<form class="comprovante" id="form-comprovante">' +
          "<h2>Depois de pagar</h2>" +
          (paraApoiador
            ? "<p>Escreva o nome da sua empresa e envie o comprovante pelo WhatsApp. Assim a gente sabe quem pagou.</p>" +
              '<label for="quem" class="sr-only">Nome da empresa</label>' +
              '<input id="quem" type="text" placeholder="Nome da empresa" autocomplete="organization" maxlength="80">'
            : "<p>Escolha seu nome e envie o comprovante pelo WhatsApp. Assim a gente sabe quem pagou.</p>" +
              '<label for="quem" class="sr-only">Seu nome</label>' +
              '<select id="quem">' + opcoes + "</select>") +
          '<button type="submit" class="btn btn--whats">' + ICONE_WHATS + "<span>Enviar comprovante</span></button>" +
          '<p class="pix__aviso" id="aviso-comprovante" role="status"></p>' +
        "</form>" +
      "</section>";

    var aviso = document.getElementById("pix-aviso");
    function avisar(el, texto) { el.textContent = texto; setTimeout(function () { el.textContent = ""; }, 3500); }

    document.getElementById("copiar-codigo").addEventListener("click", function () {
      copiar(codigo).then(function () { avisar(aviso, "Código copiado! Cole no app do banco em “Pix copia e cola”."); },
        function () { avisar(aviso, "Não consegui copiar. Use o QR Code ou a chave abaixo."); });
    });
    document.getElementById("copiar-chave").addEventListener("click", function () {
      copiar(cfg.chavePix).then(function () { avisar(aviso, "Chave copiada!"); }, function () {});
    });

    document.getElementById("form-comprovante").addEventListener("submit", function (e) {
      e.preventDefault();
      var escolha = document.getElementById("quem").value.trim();
      var avisoC = document.getElementById("aviso-comprovante");
      if (!escolha) {
        avisoC.classList.add("alerta");
        avisar(avisoC, paraApoiador ? "Escreva o nome da sua empresa." : "Escolha seu nome na lista.");
        return;
      }
      avisoC.textContent = "";
      var numero = numeroInternacional(cfg.whatsappComprovante || (dados.contatoApoio || {}).whatsapp);
      var msg;
      if (paraApoiador) {
        msg = "Olá! Paguei o apoio anual do TaxiCampos (" + valorTexto + ").\n" +
          "Empresa: " + escolha + "\nSegue o comprovante:";
      } else {
        var partes = escolha.split("|");
        msg = "Olá! Paguei a mensalidade do TaxiCampos (" + valorTexto + ").\n" +
          "Taxista: " + partes[0] + "\nPonto: " + partes[1] + "\nSegue o comprovante:";
      }
      window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });

    var alvo = document.getElementById("pix-qr");
    var desenhar = function () {
      var qr = window.qrcode(0, "M");
      qr.addData(codigo);
      qr.make();
      alvo.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true, alt: "QR Code do Pix de " + valorTexto });
    };
    if (window.qrcode) desenhar();
    else carregarScript("vendor/qrcode.js").then(desenhar, function () {
      alvo.innerHTML = '<p class="pix__semqr">Sem conexão para gerar o QR Code. Use “Copiar código Pix”.</p>';
    });
  }

  /* ---------- rotas e rolagem ---------- */

  var rolarPara = null;

  function rotear() {
    var hash = location.hash.replace(/^#\/?/, "");
    var m = hash.match(/^ponto\/(.+)$/);
    if (m) telaPonto(decodeURIComponent(m[1]));
    else if (hash === "apoiadores") telaApoiadores();
    else if (hash === "pagamento") telaPagamento(false);
    else if (hash === "apoiador") telaPagamento(true);
    else telaInicio();
    var paginaPagamento = hash === "pagamento" || hash === "apoiador";
    renderRodape(hash !== "apoiadores" && !paginaPagamento);

    // a página de pagamento não deve aparecer em buscadores
    var robots = document.querySelector('meta[name="robots"]');
    if (paginaPagamento) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else if (robots) {
      robots.remove();
    }

    if (rolarPara) rotearRolagem();
    else window.scrollTo({ top: 0, behavior: "instant" });
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

  // Se a foto não carregar, mostra as iniciais no lugar (ou o nome, no caso de logo)
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img.tagName === "IMG" && img.hasAttribute("data-nome")) {
      var nome = document.createElement("span");
      nome.className = "logo-nome";
      nome.textContent = img.getAttribute("data-nome");
      img.replaceWith(nome);
      return;
    }
    if (img.tagName !== "IMG" || !img.classList.contains("foto")) return;
    var span = document.createElement("span");
    span.className = "foto foto-iniciais";
    span.setAttribute("aria-hidden", "true");
    span.textContent = img.getAttribute("data-iniciais") || "?";
    img.replaceWith(span);
  }, true);


  window.addEventListener("hashchange", rotear);
  rotear();

  /* ---------- app instalável (tela inicial + sem internet) ---------- */

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  (function () {
    var aviso = document.getElementById("instalar");
    var sim = document.getElementById("instalar-sim");
    var nao = document.getElementById("instalar-nao");
    var dialogoIos = document.getElementById("dialogo-ios");
    if (!aviso || !sim || !nao) return;

    var CHAVE = "taxicampos_instalar_fechado";
    var instalado = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    var fechadoEm = 0;
    try { fechadoEm = +localStorage.getItem(CHAVE) || 0; } catch (e) {}
    var fechadoRecente = Date.now() - fechadoEm < 1000 * 60 * 60 * 24 * 14; // 14 dias
    if (instalado || fechadoRecente) return;

    var pedido = null;
    var ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function mostrar() { setTimeout(function () { aviso.hidden = false; }, 2500); }
    function esconder() { aviso.hidden = true; }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      pedido = e;
      mostrar();
    });
    window.addEventListener("appinstalled", esconder);

    if (ehIos && dialogoIos) mostrar();

    sim.addEventListener("click", function () {
      if (pedido) {
        pedido.prompt();
        pedido.userChoice.then(function () { pedido = null; esconder(); });
      } else if (ehIos && dialogoIos) {
        dialogoIos.showModal();
      }
    });
    nao.addEventListener("click", function () {
      esconder();
      try { localStorage.setItem(CHAVE, String(Date.now())); } catch (e) {}
    });
  })();
})();
