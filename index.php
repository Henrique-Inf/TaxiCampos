<?php
/*
 * TaxiCampos — página principal.
 * Os dados (pontos, taxistas, apoiadores, Pix...) vêm do banco de dados
 * e entram na página como window.TAXI_DADOS, o mesmo formato que o app.js usa.
 */
declare(strict_types=1);

require __DIR__ . '/inc/dados.php';

try {
    $json = taxi_json_script(taxi_carregar_dados(taxi_db()));
} catch (Throwable $e) {
    error_log('TaxiCampos: ' . $e->getMessage());
    http_response_code(503);
    header('Retry-After: 300');
    $semConfig = !is_file(TAXI_CONFIG);
    ?><!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>TaxiCampos</title><link rel="stylesheet" href="estilo.css"></head>
<body><section class="topo-simples"><p class="rotulo">TaxiCampos</p>
<h1 class="display topo-simples__titulo">Já <span class="amarelo">voltamos</span></h1>
<p class="topo-simples__texto"><?= $semConfig
    ? 'O site ainda está sendo instalado.'
    : 'O site está passando por uma manutenção rápida. Tente de novo em alguns minutos.' ?></p>
</section></body></html><?php
    exit;
}

header_remove('X-Powered-By');
header('Content-Type: text/html; charset=utf-8');
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Os taxistas de Campos do Jordão, ponto por ponto. Chame no WhatsApp ou ligue direto.">
  <meta name="theme-color" content="#0E0D0B">
  <title>TaxiCampos — Táxi em Campos do Jordão</title>
  <link rel="icon" type="image/png" href="icones/favicon-64.png">
  <link rel="apple-touch-icon" href="icones/apple-touch-icon.png">
  <link rel="manifest" href="manifest.webmanifest">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="TaxiCampos">

  <!-- Prévia ao compartilhar o link (WhatsApp, Facebook, Instagram...) -->
  <link rel="canonical" href="https://taxicampos.com.br/">
  <meta property="og:url" content="https://taxicampos.com.br/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="TaxiCampos">
  <meta property="og:title" content="TaxiCampos — Táxi em Campos do Jordão">
  <meta property="og:description" content="Os taxistas de Campos do Jordão, ponto por ponto. Chame no WhatsApp ou ligue direto.">
  <meta property="og:image" content="https://taxicampos.com.br/icones/compartilhar.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="TaxiCampos: táxi em Campos do Jordão, com botões de WhatsApp e Ligar">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" href="fontes/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fontes/schibsted-grotesk-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <header class="nav">
    <a href="#/" class="nav__marca" aria-label="TaxiCampos, página inicial">
      <span class="nav__ponto" aria-hidden="true"></span>TaxiCampos
    </a>
    <nav class="nav__links">
      <a href="#/sobre" class="nav__link">Sobre nós</a>
      <a href="#/apoiadores" class="nav__link">Apoiadores</a>
      <a href="#/" class="nav__botao" data-rolar="pontos">Pontos</a>
    </nav>
  </header>

  <main id="app" aria-live="polite"></main>

  <footer class="rodape" id="rodape" aria-label="Apoiadores"></footer>

  <div class="instalar" id="instalar" hidden>
    <img src="icones/icone-192.png" alt="" width="44" height="44">
    <p><strong>Instale o TaxiCampos</strong><span>Fica na tela inicial, como um app.</span></p>
    <button type="button" class="btn btn--amarelo" id="instalar-sim">Instalar</button>
    <button type="button" class="instalar__fechar" id="instalar-nao" aria-label="Fechar">×</button>
  </div>

  <dialog class="dialogo" id="dialogo-ios">
    <h2>Instalar no iPhone</h2>
    <ol>
      <li>Toque no botão <strong>Compartilhar</strong> do Safari (o quadrado com a seta para cima).</li>
      <li>Role e toque em <strong>Adicionar à Tela de Início</strong>.</li>
      <li>Toque em <strong>Adicionar</strong>. O TaxiCampos aparece junto dos seus apps.</li>
    </ol>
    <form method="dialog"><button class="btn btn--amarelo">Entendi</button></form>
  </dialog>

  <script>window.TAXI_DADOS = <?= $json ?>;</script>
  <script src="app.js"></script>
</body>
</html>
