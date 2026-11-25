-- ============================================================
--  TaxiCampos — estrutura do banco de dados (MySQL / MariaDB)
-- ============================================================
--  O instalador (instalar.php) cria estas tabelas sozinho a partir deste arquivo.
--  Este arquivo serve para conferência ou para criar à mão pelo phpMyAdmin.

SET NAMES utf8mb4;

-- Configurações gerais do site (cidade, DDD, mensagem do WhatsApp, Pix...)
-- O valor fica em JSON, para guardar textos, listas e objetos no mesmo lugar.
CREATE TABLE IF NOT EXISTS configuracoes (
  chave         VARCHAR(64)  NOT NULL,
  valor         TEXT         NOT NULL,
  atualizado_em TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (chave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pontos de táxi
CREATE TABLE IF NOT EXISTS pontos (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(80)   NOT NULL,              -- usado no link: #/ponto/<slug>
  numero        VARCHAR(10)   NOT NULL DEFAULT '',
  nome          VARCHAR(120)  NOT NULL,
  regiao        VARCHAR(80)   NOT NULL DEFAULT '',
  endereco      VARCHAR(255)  NOT NULL DEFAULT '',
  telefone      VARCHAR(30)   NOT NULL DEFAULT '',
  mapa          VARCHAR(500)  NOT NULL DEFAULT '',
  lat           DECIMAL(10,7) NULL,
  lng           DECIMAL(10,7) NULL,
  ordem         INT           NOT NULL DEFAULT 0,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pontos_slug (slug),
  KEY ix_pontos_ordem (ativo, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Taxistas (cada um pertence a um ponto)
CREATE TABLE IF NOT EXISTS taxistas (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  ponto_id      INT UNSIGNED  NOT NULL,
  nome          VARCHAR(120)  NOT NULL,
  carro         VARCHAR(120)  NOT NULL DEFAULT '',
  telefone      VARCHAR(30)   NOT NULL,
  whatsapp      VARCHAR(30)   NOT NULL DEFAULT '',   -- vazio = usa o telefone
  foto          VARCHAR(255)  NOT NULL DEFAULT '',   -- ex.: fotos/joao.jpg
  ordem         INT           NOT NULL DEFAULT 0,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_taxistas_ponto (ponto_id, ativo, ordem),
  CONSTRAINT fk_taxistas_ponto FOREIGN KEY (ponto_id) REFERENCES pontos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Apoiadores do site
CREATE TABLE IF NOT EXISTS apoiadores (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(120)  NOT NULL,
  logo          VARCHAR(255)  NOT NULL DEFAULT '',   -- ex.: apoiadores/gwg-telecom.png
  descricao     VARCHAR(255)  NOT NULL DEFAULT '',
  site          VARCHAR(500)  NOT NULL DEFAULT '',
  ordem         INT           NOT NULL DEFAULT 0,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_apoiadores_ordem (ativo, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuários do painel /admin (senha guardada só como hash, nunca em texto)
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(120)  NOT NULL,
  usuario       VARCHAR(60)   NOT NULL,
  senha_hash    VARCHAR(255)  NOT NULL,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_login  TIMESTAMP     NULL,
  criado_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
