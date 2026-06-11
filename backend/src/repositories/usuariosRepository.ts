import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  ativo: number;
}

export const usuariosRepository = {
  async findAll(): Promise<Omit<Usuario, 'senha'>[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome, email, ativo FROM usuarios WHERE ativo = 1 ORDER BY id ASC'
    );
    return rows as Omit<Usuario, 'senha'>[];
  },

  async findById(id: number): Promise<Omit<Usuario, 'senha'> | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nome, email, ativo FROM usuarios WHERE id = ? AND ativo = 1', [id]
    );
    return rows.length ? (rows[0] as Omit<Usuario, 'senha'>) : null;
  },

  async findByEmail(email: string): Promise<Usuario | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = ? AND ativo = 1', [email]
    );
    return rows.length ? (rows[0] as Usuario) : null;
  },

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT id FROM usuarios WHERE email = ? AND id != ? AND ativo = 1'
      : 'SELECT id FROM usuarios WHERE email = ? AND ativo = 1';
    const params = excludeId ? [email, excludeId] : [email];
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows.length > 0;
  },

  async insert(nome: string, email: string, passwordHash: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, passwordHash]
    );
    return result.insertId;
  },

  async update(id: number, nome: string, email: string, passwordHash?: string): Promise<boolean> {
    let result: ResultSetHeader;
    if (passwordHash) {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ? AND ativo = 1',
        [nome, email, passwordHash, id]
      );
    } else {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE usuarios SET nome = ?, email = ? WHERE id = ? AND ativo = 1',
        [nome, email, id]
      );
    }
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]
    );
    return result.affectedRows > 0;
  },
};
