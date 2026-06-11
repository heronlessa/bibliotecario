import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

export interface Autor {
  id: number;
  nome: string;
  nacionalidade: string | null;
  ativo: number;
}

export const autoresRepository = {
  async findAll(): Promise<Autor[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM autores WHERE ativo = 1 ORDER BY nome ASC'
    );
    return rows as Autor[];
  },

  async findById(id: number): Promise<Autor | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM autores WHERE id = ? AND ativo = 1', [id]
    );
    return rows.length ? (rows[0] as Autor) : null;
  },

  async insert(nome: string, nacionalidade: string | null): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO autores (nome, nacionalidade) VALUES (?, ?)', [nome, nacionalidade]
    );
    return result.insertId;
  },

  async update(id: number, nome: string, nacionalidade: string | null): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE autores SET nome = ?, nacionalidade = ? WHERE id = ? AND ativo = 1',
      [nome, nacionalidade, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE autores SET ativo = 0 WHERE id = ?', [id]
    );
    return result.affectedRows > 0;
  },
};
