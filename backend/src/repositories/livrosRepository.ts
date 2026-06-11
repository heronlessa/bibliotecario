import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

export interface Livro {
  id: number;
  titulo: string;
  autor_id: number;
  autor_nome?: string;
  isbn: string | null;
  ano: number | null;
  disponivel: boolean;
  ativo: number;
}

export const livrosRepository = {
  async findAll(): Promise<Livro[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT l.*, a.nome AS autor_nome FROM livros l JOIN autores a ON l.autor_id = a.id WHERE l.ativo = 1 ORDER BY l.id ASC'
    );
    return rows.map(r => ({ ...r, disponivel: Boolean(r.disponivel) })) as Livro[];
  },

  async findById(id: number): Promise<Livro | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT l.*, a.nome AS autor_nome FROM livros l JOIN autores a ON l.autor_id = a.id WHERE l.id = ? AND l.ativo = 1',
      [id]
    );
    if (!rows.length) return null;
    return { ...rows[0], disponivel: Boolean(rows[0].disponivel) } as Livro;
  },

  async insert(titulo: string, autor_id: number, isbn: string | null, ano: number | null, disponivel: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)',
      [titulo, autor_id, isbn, ano, disponivel]
    );
    return result.insertId;
  },

  async update(id: number, titulo: string, autor_id: number, isbn: string | null, ano: number | null, disponivel: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE livros SET titulo = ?, autor_id = ?, isbn = ?, ano = ?, disponivel = ? WHERE id = ? AND ativo = 1',
      [titulo, autor_id, isbn, ano, disponivel, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE livros SET ativo = 0 WHERE id = ?', [id]
    );
    return result.affectedRows > 0;
  },

  async updateAvailability(id: number, disponivel: boolean): Promise<void> {
    await pool.execute(
      'UPDATE livros SET disponivel = ? WHERE id = ?', [disponivel ? 1 : 0, id]
    );
  },
};
