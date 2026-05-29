-- ============================================================
-- Bibliotecário — Schema do Banco de Dados
-- Execute via phpMyAdmin ou:
--   mysql -u root -p < backend/database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS biblioteca;
USE biblioteca;

CREATE TABLE IF NOT EXISTS autores (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  nacionalidade VARCHAR(80),
  ativo         TINYINT(1)   DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usuarios (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo TINYINT(1)   DEFAULT 1,
  UNIQUE KEY uq_email (email)
);

CREATE TABLE IF NOT EXISTS livros (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  titulo     VARCHAR(150) NOT NULL,
  autor_id   INT          NOT NULL,
  isbn       VARCHAR(17),
  ano        INT,
  disponivel TINYINT(1)   DEFAULT 1,
  ativo      TINYINT(1)   DEFAULT 1,
  FOREIGN KEY (autor_id) REFERENCES autores(id)
);

CREATE TABLE IF NOT EXISTS emprestimos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  livro_id        INT  NOT NULL,
  usuario_id      INT  NOT NULL,
  data_saida      DATE NOT NULL,
  data_prevista   DATE NOT NULL,
  data_devolucao  DATE,
  ativo           TINYINT(1) DEFAULT 1,
  FOREIGN KEY (livro_id)   REFERENCES livros(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ── Seed: autores ────────────────────────────────────────────────
INSERT IGNORE INTO autores (id, nome, nacionalidade) VALUES
  (1, 'Machado de Assis',  'Brasileiro'),
  (2, 'J.R.R. Tolkien',    'Britânico'),
  (3, 'Robert C. Martin',  'Americano');

-- ── Seed: livros ─────────────────────────────────────────────────
INSERT IGNORE INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES
  ('Dom Casmurro',        1, '978-85-359-0277-5', 1899, 1),
  ('O Senhor dos Anéis',  2, '978-85-333-0235-9', 1954, 0),
  ('Clean Code',          3, '978-85-7608-539-2', 2008, 1);

-- ── Seed: usuário admin (senha: admin123) ────────────────────────
INSERT IGNORE INTO usuarios (id, nome, email, senha) VALUES
  (1, 'Administrador', 'admin@biblioteca.com',
   '$2y$10$uJ/2gnlEYngdkSe5D0dwW.Yxt70dLBrQmoofSAPoMNc5JhoqKFYrC');
