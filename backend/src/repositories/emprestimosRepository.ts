import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

export interface Emprestimo {
  id: number;
  livro_id: number;
  usuario_id: number;
  livro_titulo?: string;
  usuario_nome?: string;
  data_saida: string;
  data_prevista: string;
  data_devolucao: string | null;
  ativo: number;
}

const SELECT_WITH_JOIN =
  'SELECT e.*, l.titulo AS livro_titulo, u.nome AS usuario_nome' +
  ' FROM emprestimos e' +
  ' JOIN livros   l ON e.livro_id   = l.id' +
  ' JOIN usuarios u ON e.usuario_id = u.id';

export const emprestimosRepository = {
  async findAll(): Promise<Emprestimo[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      SELECT_WITH_JOIN + ' WHERE e.ativo = 1 ORDER BY e.id DESC'
    );
    return rows as Emprestimo[];
  },

  async findById(id: number): Promise<Emprestimo | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      SELECT_WITH_JOIN + ' WHERE e.id = ? AND e.ativo = 1', [id]
    );
    return rows.length ? (rows[0] as Emprestimo) : null;
  },

  async insert(livro_id: number, usuario_id: number, data_saida: string, data_prevista: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO emprestimos (livro_id, usuario_id, data_saida, data_prevista) VALUES (?, ?, ?, ?)',
      [livro_id, usuario_id, data_saida, data_prevista]
    );
    return result.insertId;
  },

  async update(id: number, livro_id: number, usuario_id: number, data_saida: string, data_prevista: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET livro_id = ?, usuario_id = ?, data_saida = ?, data_prevista = ? WHERE id = ? AND ativo = 1',
      [livro_id, usuario_id, data_saida, data_prevista, id]
    );
    return result.affectedRows > 0;
  },

  async registerReturn(id: number, date: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET data_devolucao = ? WHERE id = ?', [date, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET ativo = 0 WHERE id = ?', [id]
    );
    return result.affectedRows > 0;
  },
};
