<?php
/*
 * ============================================================
 *  TaxiCampos — instalador
 * ============================================================
 *  Como usar:
 *   1. Envie para a pasta do site (htdocs) só este arquivo e o
 *      taxicampos-site.zip.
 *   2. Abra  https://SEU-SITE/instalar.php?token=CODIGO
 *      (o código vem junto com o pacote).
 *   3. Preencha os dados do banco que aparecem no painel da hospedagem.
 *
 *  O instalador descompacta o site, grava inc/config.php, cria as
 *  tabelas, importa pontos/taxistas/apoiadores e depois se apaga.
 *
 *  Instalação direto do GitHub (Git da Hostinger), sem pacote:
 *  sem token, o instalador só aceita um banco no próprio servidor
 *  (localhost) cujo nome e usuário comecem com o usuário da conta
 *  de hospedagem (ex.: u123456789_taxicampos). Assim ninguém de fora
 *  consegue apontar o site para um banco dele.
 */

declare(strict_types=1);

const TOKEN_INSTALACAO = '__TOKEN_INSTALACAO__';
const PACOTE_SITE = __DIR__ . '/taxicampos-site.zip';

session_start();
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

function h($texto): string
{
    return htmlspecialchars((string)$texto, ENT_QUOTES, 'UTF-8');
}

function pagina(string $titulo, string $corpo): void
{
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">'
        . '<title>' . h($titulo) . ' — TaxiCampos</title><style>'
        . 'body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0E0D0B;color:#F7F0E1}'
        . 'main{max-width:560px;margin:0 auto;padding:40px 20px 60px}'
        . 'h1{font-size:2.4rem;line-height:1;margin:0 0 6px;text-transform:uppercase;letter-spacing:-.01em}'
        . 'h1 span{color:#FFC400}.sub{color:rgba(247,240,225,.66);margin:0 0 28px}'
        . '.cartao{background:#191714;border:1px solid rgba(247,240,225,.1);border-radius:18px;padding:22px;margin-bottom:16px}'
        . 'label{display:block;font-weight:700;font-size:.9rem;margin:14px 0 6px}'
        . 'small{display:block;color:rgba(247,240,225,.5);font-weight:400;margin-top:4px}'
        . 'input{width:100%;box-sizing:border-box;height:48px;padding:0 14px;border-radius:12px;border:1.5px solid rgba(247,240,225,.15);background:#0E0D0B;color:#F7F0E1;font:inherit}'
        . 'input:focus{outline:none;border-color:#FFC400}'
        . 'button,.botao{display:inline-block;margin-top:20px;height:50px;padding:0 26px;border:0;border-radius:999px;background:#FFC400;color:#0E0D0B;font:700 1rem system-ui,sans-serif;cursor:pointer;text-decoration:none;line-height:50px}'
        . '.erro{background:rgba(180,35,24,.18);border:1px solid #B42318;color:#ffb4ab;padding:14px 16px;border-radius:12px;margin-bottom:16px}'
        . '.ok{background:rgba(37,211,102,.12);border:1px solid #25D366;padding:14px 16px;border-radius:12px;margin-bottom:16px}'
        . 'ul{padding-left:20px;margin:8px 0 0}code{background:rgba(247,240,225,.08);padding:1px 6px;border-radius:6px}'
        . '</style></head><body><main>' . $corpo . '</main></body></html>';
    exit;
}

/* ---------- 1. Token ou conta de hospedagem ---------- */

/* Usuário da conta de hospedagem (ex.: u123456789), se der para ter certeza dele */
function prefixo_conta(): ?string
{
    $nome = '';
    if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
        $info = posix_getpwuid(posix_geteuid());
        $nome = is_array($info) ? (string)($info['name'] ?? '') : '';
    }
    if ($nome === '') {
        $nome = (string)get_current_user();
    }
    $genericos = ['root', 'www-data', 'apache', 'nobody', 'daemon', 'nginx', 'http', 'litespeed', 'lsadm'];
    if (!preg_match('/^[a-z][a-z0-9]{2,31}$/', $nome) || in_array($nome, $genericos, true)) {
        return null;
    }
    // o site precisa estar dentro da pasta da própria conta
    if (!str_contains(str_replace('\\', '/', __DIR__) . '/', '/' . $nome . '/')) {
        return null;
    }
    return $nome;
}

$modoPacote = TOKEN_INSTALACAO !== '__TOKEN' . '_INSTALACAO__';
$prefixo = $modoPacote ? null : prefixo_conta();

if (!$modoPacote && $prefixo === null) {
    http_response_code(403);
    pagina('Instalador', '<h1>Insta<span>lador</span></h1><p class="sub">Não consegui identificar a conta de hospedagem. '
        . 'Use o arquivo <code>instalar.php</code> que vem no pacote de instalação.</p>');
}

$token = (string)($_GET['token'] ?? $_POST['token'] ?? '');
if ($modoPacote && !hash_equals(TOKEN_INSTALACAO, $token)) {
    http_response_code(403);
    pagina('Acesso negado', '<h1>Acesso <span>negado</span></h1><p class="sub">Abra este endereço com o código de instalação: '
        . '<code>instalar.php?token=...</code></p>');
}

/* ---------- 2. Descompactar o site, se ainda não foi ---------- */

$avisos = [];
if (!is_file(__DIR__ . '/inc/instalacao.php')) {
    if (!is_file(PACOTE_SITE)) {
        pagina('Falta o pacote', '<h1>Falta o <span>pacote</span></h1><p class="sub">Envie o arquivo '
            . '<code>taxicampos-site.zip</code> para a mesma pasta deste instalador e recarregue a página.</p>');
    }
    try {
        // ZipArchive vem antes de carregar inc/, porque inc/ ainda não existe
        if (!class_exists('ZipArchive')) {
            throw new RuntimeException('O servidor não tem a extensão ZipArchive. Envie os arquivos do site descompactados pelo FTP.');
        }
        $zip = new ZipArchive();
        if ($zip->open(PACOTE_SITE) !== true) {
            throw new RuntimeException('Não consegui abrir taxicampos-site.zip.');
        }
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nome = (string)$zip->getNameIndex($i);
            if (str_contains($nome, '..') || str_starts_with($nome, '/') || str_contains($nome, '\\')) {
                throw new RuntimeException('Pacote com caminho inválido.');
            }
        }
        if (!$zip->extractTo(__DIR__)) {
            throw new RuntimeException('Falha ao descompactar o pacote.');
        }
        $avisos[] = 'Arquivos do site descompactados (' . $zip->numFiles . ' itens).';
        $zip->close();
    } catch (Throwable $e) {
        pagina('Erro', '<h1>Algo deu <span>errado</span></h1><div class="erro">' . h($e->getMessage()) . '</div>');
    }
}

require __DIR__ . '/inc/instalacao.php';

/* ---------- 3. Já instalado? ---------- */

// com o inc/config.php no lugar, o instalador nunca mais mostra o formulário
// (nem se o banco estiver fora do ar por um instante)
if (is_file(TAXI_CONFIG) || taxi_esta_instalado()) {
    @unlink(PACOTE_SITE);
    $apagou = @unlink(__FILE__);
    pagina('Já instalado', '<h1>Já está <span>instalado</span></h1><div class="ok">O TaxiCampos já está funcionando.</div>'
        . ($apagou ? '' : '<div class="erro">Apague o arquivo <code>instalar.php</code> pelo gerenciador de arquivos.</div>')
        . '<a class="botao" href="./">Abrir o site</a>');
}

/* ---------- 4. Formulário do banco ---------- */

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

$erro = '';
$valores = $prefixo === null
    ? ['db_host' => '', 'db_nome' => '', 'db_usuario' => '', 'db_porta' => '3306']
    : ['db_host' => 'localhost', 'db_nome' => $prefixo . '_', 'db_usuario' => $prefixo . '_', 'db_porta' => '3306'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($valores as $k => $v) {
        $valores[$k] = trim((string)($_POST[$k] ?? $v));
    }
    $senha = (string)($_POST['db_senha'] ?? '');

    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
        $erro = 'O formulário expirou. Recarregue a página e tente de novo.';
    } elseif ($valores['db_host'] === '' || $valores['db_nome'] === '' || $valores['db_usuario'] === '') {
        $erro = 'Preencha o servidor, o nome do banco e o usuário.';
    } elseif ($prefixo !== null && (
        !in_array(strtolower($valores['db_host']), ['localhost', '127.0.0.1'], true)
        || !str_starts_with($valores['db_nome'], $prefixo . '_') || strlen($valores['db_nome']) <= strlen($prefixo) + 1
        || !str_starts_with($valores['db_usuario'], $prefixo . '_') || strlen($valores['db_usuario']) <= strlen($prefixo) + 1
    )) {
        $erro = 'Use um banco desta hospedagem: servidor localhost, e nome e usuário começando com ' . $prefixo . '_';
    } else {
        $config = $valores + ['db_senha' => $senha];
        try {
            $pdo = taxi_conectar($config);
            taxi_criar_tabelas($pdo);
            $resultado = taxi_importar_dados_iniciais($pdo);
            taxi_gravar_config($config);

            @unlink(PACOTE_SITE);
            $apagou = @unlink(__FILE__);
            unset($_SESSION['csrf']);

            $resumo = $resultado['importado']
                ? '<ul><li>' . (int)$resultado['pontos'] . ' pontos</li><li>' . (int)$resultado['taxistas'] . ' taxistas</li><li>'
                    . (int)$resultado['apoiadores'] . ' apoiador(es)</li></ul>'
                : '<p>' . h($resultado['motivo']) . '</p>';

            pagina('Instalado', '<h1>Tudo <span>pronto!</span></h1><p class="sub">O TaxiCampos foi instalado com sucesso.</p>'
                . '<div class="ok"><strong>Importado para o banco:</strong>' . $resumo . '</div>'
                . ($apagou ? '<p class="sub">O instalador se apagou sozinho, por segurança.</p>'
                    : '<div class="erro">Por segurança, apague o arquivo <code>instalar.php</code> pelo gerenciador de arquivos.</div>')
                . '<a class="botao" href="./">Abrir o site</a>');
        } catch (PDOException $e) {
            error_log('TaxiCampos instalador: ' . $e->getMessage());
            $erro = 'Não consegui entrar no banco com esses dados. Confira o servidor (MySQL Hostname), o nome do banco, '
                . 'o usuário e a senha no painel da hospedagem. Detalhe técnico: ' . $e->getCode();
        } catch (Throwable $e) {
            error_log('TaxiCampos instalador: ' . $e->getMessage());
            $erro = $e->getMessage();
        }
    }
}

$campos = function (string $nome, string $rotulo, string $dica, string $tipo = 'text') use ($valores): string {
    $valor = $tipo === 'password' ? '' : ($valores[$nome] ?? '');
    return '<label for="' . $nome . '">' . h($rotulo) . '<small>' . h($dica) . '</small></label>'
        . '<input id="' . $nome . '" name="' . $nome . '" type="' . $tipo . '" value="' . h($valor) . '" autocomplete="off" spellcheck="false">';
};

pagina('Instalar', '<h1>Instalar o <span>TaxiCampos</span></h1>'
    . '<p class="sub">Copie os dados do banco que aparecem no painel da hospedagem, em <strong>Bancos de dados MySQL</strong>.</p>'
    . implode('', array_map(fn($a) => '<div class="ok">' . h($a) . '</div>', $avisos))
    . ($erro ? '<div class="erro">' . h($erro) . '</div>' : '')
    . '<form method="post" class="cartao">'
    . '<input type="hidden" name="csrf" value="' . h($_SESSION['csrf']) . '">'
    . '<input type="hidden" name="token" value="' . h($token) . '">'
    . $campos('db_host', 'Servidor do banco', 'Na Hostinger é localhost')
    . $campos('db_nome', 'Nome do banco', 'Ex.: u123456789_taxicampos')
    . $campos('db_usuario', 'Usuário do banco', 'Ex.: u123456789_taxicampos')
    . $campos('db_senha', 'Senha do banco', 'A senha que você escolheu ao criar o banco', 'password')
    . $campos('db_porta', 'Porta', 'Deixe 3306, a não ser que o painel mostre outra')
    . '<button type="submit">Instalar</button>'
    . '</form>');
