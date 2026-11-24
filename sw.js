/*
 * Service worker do TaxiCampos: deixa o site abrir mesmo sem internet
 * (ou com sinal fraco na serra) e permite instalar como app.
 *
 * - Páginas, CSS, JS e dados.js: busca primeiro na internet (para ter sempre
 *   os contatos atualizados) e usa a cópia guardada se estiver sem sinal.
 * - Fontes, ícones, fotos e logos: usa a cópia guardada (mais rápido).
 *
 * Ao mudar a lista de arquivos abaixo, aumente o número da VERSAO.
 */
var VERSAO = "taxicampos-v1";
var ARQUIVOS = [
  "./",
  "index.html",
  "estilo.css",
  "app.js",
  "dados.js",
  "manifest.webmanifest",
  "fontes/big-shoulders-display-latin-700-normal.woff2",
  "fontes/big-shoulders-display-latin-800-normal.woff2",
  "fontes/big-shoulders-display-latin-900-normal.woff2",
  "fontes/schibsted-grotesk-latin-400-normal.woff2",
  "fontes/schibsted-grotesk-latin-500-normal.woff2",
  "fontes/schibsted-grotesk-latin-700-normal.woff2",
  "icones/icone-192.png",
  "icones/icone-512.png",
  "icones/apple-touch-icon.png",
  "icones/favicon-64.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSAO).then(function (cache) {
      // guarda um por um: se algum falhar, os outros continuam
      return Promise.all(ARQUIVOS.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== VERSAO; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function guardar(req, resp) {
  if (resp && (resp.ok || resp.type === "opaque")) {
    var copia = resp.clone();
    caches.open(VERSAO).then(function (cache) { cache.put(req, copia); });
  }
  return resp;
}

function internetPrimeiro(req) {
  return fetch(req).then(function (resp) { return guardar(req, resp); })
    .catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || (req.mode === "navigate" ? caches.match("index.html") : undefined);
      });
    });
}

function guardadoPrimeiro(req) {
  return caches.match(req).then(function (r) {
    return r || fetch(req).then(function (resp) { return guardar(req, resp); });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (/\/(fontes|icones|fotos|apoiadores)\//.test(url.pathname)) {
      e.respondWith(guardadoPrimeiro(req));
    } else {
      e.respondWith(internetPrimeiro(req));
    }
  } else if (url.hostname === "images.unsplash.com") {
    e.respondWith(guardadoPrimeiro(req));
  }
});
