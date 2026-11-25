<?php
/*
 * Funções do instalador: criar tabelas, importar os dados iniciais
 * e gravar o inc/config.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

/* Executa o inc/estrutura.sql comando por comando */
function taxi_criar_tabelas(PDO $pdo): void
{
    $sql = file_get_contents(__DIR__ . '/estrutura.sql');
    if ($sql === false) {
        throw new RuntimeException('Não encontrei inc/estrutura.sql.');
    }
    // remove comentários de linha e divide por ";" no fim da linha
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (preg_split('/;\s*$/m', $sql) as $comando) {
        $comando = trim($comando);
        if ($comando !== '') {
            $pdo->exec($comando);
        }
    }
}

/* Importa pontos, taxistas, apoiadores e configurações — só se o banco estiver vazio */
function taxi_importar_dados_iniciais(PDO $pdo): array
{
    $jaTem = (int)$pdo->query('SELECT COUNT(*) FROM pontos')->fetchColumn();
    if ($jaTem > 0) {
        return ['importado' => false, 'motivo' => 'O banco já tem pontos cadastrados; nada foi importado.'];
    }

    $seed = json_decode((string)file_get_contents(__DIR__ . '/dados-iniciais.json'), true);
    if (!is_array($seed)) {
        throw new RuntimeException('Não consegui ler inc/dados-iniciais.json.');
    }

    $pdo->beginTransaction();
    try {
        $cfg = $pdo->prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
                              ON DUPLICATE KEY UPDATE valor = VALUES(valor)');
        foreach ($seed['configuracoes'] as $chave => $valor) {
            $cfg->execute([$chave, json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
        }

        $insPonto = $pdo->prepare('INSERT INTO pontos (slug, numero, nome, regiao, endereco, telefone, mapa, lat, lng, ordem)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insTaxista = $pdo->prepare('INSERT INTO taxistas (ponto_id, nome, carro, telefone, whatsapp, foto, ordem)
                                     VALUES (?, ?, ?, ?, ?, ?, ?)');
        $nPontos = 0;
        $nTaxistas = 0;
        foreach ($seed['pontos'] as $p) {
            $insPonto->execute([
                $p['slug'], $p['numero'], $p['nome'], $p['regiao'], $p['endereco'], $p['telefone'], $p['mapa'],
                ($p['lat'] === null || $p['lat'] === '') ? null : $p['lat'],
                ($p['lng'] === null || $p['lng'] === '') ? null : $p['lng'],
                (int)$p['ordem'],
            ]);
            $pontoId = (int)$pdo->lastInsertId();
            $nPontos++;
            foreach ($p['taxistas'] as $t) {
                $insTaxista->execute([$pontoId, $t['nome'], $t['carro'], $t['telefone'], $t['whatsapp'], $t['foto'], (int)$t['ordem']]);
                $nTaxistas++;
            }
        }

        $insApoio = $pdo->prepare('INSERT INTO apoiadores (nome, logo, descricao, site, ordem) VALUES (?, ?, ?, ?, ?)');
        $nApoio = 0;
        foreach ($seed['apoiadores'] as $a) {
            $insApoio->execute([$a['nome'], $a['logo'], $a['descricao'], $a['site'], (int)$a['ordem']]);
            $nApoio++;
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return ['importado' => true, 'pontos' => $nPontos, 'taxistas' => $nTaxistas, 'apoiadores' => $nApoio];
}

/* Grava o inc/config.php com as credenciais do banco */
function taxi_gravar_config(array $c): void
{
    $conteudo = "<?php\n"
        . "// Gerado pelo instalador do TaxiCampos em " . date('Y-m-d H:i:s') . ".\n"
        . "// Contém a senha do banco: NUNCA envie este arquivo para o GitHub.\n"
        . 'return ' . var_export([
            'db_host'    => (string)$c['db_host'],
            'db_porta'   => (int)($c['db_porta'] ?? 3306),
            'db_nome'    => (string)$c['db_nome'],
            'db_usuario' => (string)$c['db_usuario'],
            'db_senha'   => (string)$c['db_senha'],
        ], true) . ";\n";

    if (file_put_contents(TAXI_CONFIG, $conteudo, LOCK_EX) === false) {
        throw new RuntimeException('Não consegui gravar inc/config.php (permissão da pasta inc).');
    }
    @chmod(TAXI_CONFIG, 0640);
}

function taxi_esta_instalado(): bool
{
    if (!is_file(TAXI_CONFIG)) {
        return false;
    }
    try {
        $pdo = taxi_db();
        return (int)$pdo->query('SELECT COUNT(*) FROM pontos')->fetchColumn() > 0;
    } catch (Throwable $e) {
        return false;
    }
}
