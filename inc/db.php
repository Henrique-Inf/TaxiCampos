<?php
/*
 * Conexão com o banco de dados (PDO + MySQL).
 * As credenciais ficam em inc/config.php, criado pelo instalador.
 * Esse arquivo NUNCA deve ir para o GitHub (está no .gitignore).
 */

declare(strict_types=1);

const TAXI_CONFIG = __DIR__ . '/config.php';

function taxi_config(): array
{
    static $config = null;
    if ($config === null) {
        if (!is_file(TAXI_CONFIG)) {
            throw new RuntimeException('Site ainda não instalado (falta inc/config.php).');
        }
        $config = require TAXI_CONFIG;
        if (!is_array($config)) {
            throw new RuntimeException('inc/config.php inválido.');
        }
    }
    return $config;
}

function taxi_conectar(array $c): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $c['db_host'],
        (int)($c['db_porta'] ?? 3306),
        $c['db_nome']
    );
    $pdo = new PDO($dsn, $c['db_usuario'], $c['db_senha'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    return $pdo;
}

function taxi_db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = taxi_conectar(taxi_config());
    }
    return $pdo;
}
