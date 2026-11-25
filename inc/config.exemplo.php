<?php
/*
 * MODELO do arquivo de configuração.
 *
 * O instalador (instalar.php) cria o inc/config.php de verdade sozinho.
 * Só use este modelo se precisar criar à mão: copie para inc/config.php
 * e preencha com os dados do banco que aparecem no painel da hospedagem.
 *
 * NUNCA envie o inc/config.php para o GitHub: ele tem a senha do banco.
 */

return [
    'db_host'    => 'sqlXXX.infinityfree.com', // "MySQL Hostname" no painel
    'db_porta'   => 3306,
    'db_nome'    => 'if0_00000000_taxicampos', // "MySQL Database Name"
    'db_usuario' => 'if0_00000000',            // "MySQL Username"
    'db_senha'   => 'SENHA_DO_BANCO',          // "MySQL Password"
];
