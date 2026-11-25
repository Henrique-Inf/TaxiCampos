<?php
/*
 * Lê pontos, taxistas, apoiadores e configurações do banco e monta
 * a mesma estrutura que o app.js usa (window.TAXI_DADOS).
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function taxi_configuracoes(PDO $pdo): array
{
    $cfg = [];
    foreach ($pdo->query('SELECT chave, valor FROM configuracoes') as $linha) {
        $valor = json_decode($linha['valor'], true);
        $cfg[$linha['chave']] = (json_last_error() === JSON_ERROR_NONE) ? $valor : $linha['valor'];
    }
    return $cfg;
}

function taxi_coordenada($valor): ?string
{
    if ($valor === null || $valor === '') {
        return null;
    }
    // remove zeros sobrando à direita: -22.7389428000 → -22.7389428
    return rtrim(rtrim((string)$valor, '0'), '.');
}

function taxi_carregar_dados(PDO $pdo): array
{
    $cfg = taxi_configuracoes($pdo);

    $pontos = [];
    $porId = [];
    $sql = 'SELECT id, slug, numero, nome, regiao, endereco, telefone, mapa, lat, lng
              FROM pontos WHERE ativo = 1 ORDER BY ordem, id';
    foreach ($pdo->query($sql) as $p) {
        $porId[(int)$p['id']] = count($pontos);
        $pontos[] = [
            'id'       => $p['slug'],
            'numero'   => $p['numero'],
            'nome'     => $p['nome'],
            'regiao'   => $p['regiao'],
            'endereco' => $p['endereco'],
            'telefone' => $p['telefone'],
            'mapa'     => $p['mapa'],
            'lat'      => taxi_coordenada($p['lat']) ?? '',
            'lng'      => taxi_coordenada($p['lng']) ?? '',
            'taxistas' => [],
        ];
    }

    $sql = 'SELECT ponto_id, nome, carro, telefone, whatsapp, foto
              FROM taxistas WHERE ativo = 1 ORDER BY ponto_id, ordem, id';
    foreach ($pdo->query($sql) as $t) {
        $i = $porId[(int)$t['ponto_id']] ?? null;
        if ($i === null) {
            continue; // taxista de ponto desativado
        }
        $taxista = [
            'nome'     => $t['nome'],
            'carro'    => $t['carro'],
            'telefone' => $t['telefone'],
        ];
        if ($t['whatsapp'] !== '') {
            $taxista['whatsapp'] = $t['whatsapp'];
        }
        $taxista['foto'] = $t['foto'];
        $pontos[$i]['taxistas'][] = $taxista;
    }

    $apoiadores = [];
    $sql = 'SELECT nome, logo, descricao, site FROM apoiadores WHERE ativo = 1 ORDER BY ordem, id';
    foreach ($pdo->query($sql) as $a) {
        $apoiadores[] = $a;
    }

    return [
        'cidade'            => $cfg['cidade'] ?? 'Campos do Jordão',
        'dddPadrao'         => $cfg['dddPadrao'] ?? '12',
        'regioes'           => $cfg['regioes'] ?? [],
        'mensagemWhatsapp'  => $cfg['mensagemWhatsapp'] ?? '',
        'pagamento'         => $cfg['pagamento'] ?? new stdClass(),
        'pagamentoApoiador' => $cfg['pagamentoApoiador'] ?? new stdClass(),
        'contatoApoio'      => $cfg['contatoApoio'] ?? new stdClass(),
        'pontos'            => $pontos,
        'apoiadores'        => $apoiadores,
    ];
}

/* JSON seguro para colocar dentro de <script> */
function taxi_json_script($dados): string
{
    return json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
}
