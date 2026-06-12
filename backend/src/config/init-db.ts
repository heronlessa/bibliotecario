import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export function initDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autores (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      nacionalidade TEXT,
      ativo         INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      nome  TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS livros (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo     TEXT NOT NULL,
      autor_id   INTEGER NOT NULL,
      isbn       TEXT,
      ano        INTEGER,
      disponivel INTEGER DEFAULT 1,
      ativo      INTEGER DEFAULT 1,
      FOREIGN KEY (autor_id) REFERENCES autores(id)
    );

    CREATE TABLE IF NOT EXISTS emprestimos (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      livro_id       INTEGER NOT NULL,
      usuario_id     INTEGER NOT NULL,
      data_saida     TEXT NOT NULL,
      data_prevista  TEXT NOT NULL,
      data_devolucao TEXT,
      ativo          INTEGER DEFAULT 1,
      FOREIGN KEY (livro_id)   REFERENCES livros(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  if ((db.prepare('SELECT COUNT(*) AS total FROM autores').get() as { total: number }).total === 0) {
    db.prepare('INSERT INTO autores (id, nome, nacionalidade) VALUES (?, ?, ?)').run(1, 'Machado de Assis', 'Brasileiro');
    db.prepare('INSERT INTO autores (id, nome, nacionalidade) VALUES (?, ?, ?)').run(2, 'J.R.R. Tolkien', 'Britanico');
    db.prepare('INSERT INTO autores (id, nome, nacionalidade) VALUES (?, ?, ?)').run(3, 'Robert C. Martin', 'Americano');
  }

  if ((db.prepare('SELECT COUNT(*) AS total FROM livros').get() as { total: number }).total === 0) {
    db.prepare('INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)')
      .run('Dom Casmurro', 1, '978-85-359-0277-5', 1899, 1);
    db.prepare('INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)')
      .run('O Senhor dos Aneis', 2, '978-85-333-0235-9', 1954, 0);
    db.prepare('INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)')
      .run('Clean Code', 3, '978-85-7608-539-2', 2008, 1);
  }

  if ((db.prepare('SELECT COUNT(*) AS total FROM usuarios').get() as { total: number }).total === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)')
      .run('Administrador', 'admin@biblioteca.com', hash);
  }
}
