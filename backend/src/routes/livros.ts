import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import { autenticar } from '../middlewares/sessao';
import { validarLivro } from '../middlewares/validacao';
import { ok, criado, erroNaoEncontrado, erroServidor } from '../helpers/resposta';

const router = Router();

// GET /api/livros
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT l.*, a.nome AS autor_nome
        FROM livros l
        JOIN autores a ON l.autor_id = a.id
       WHERE l.ativo = 1
       ORDER BY l.id ASC
    `);
    return ok(res, rows.map(r => ({ ...r, disponivel: Boolean(r.disponivel) })), 'Livros carregados.');
  } catch (e) { return erroServidor(res, e); }
});

// GET /api/livros/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT l.*, a.nome AS autor_nome
        FROM livros l
        JOIN autores a ON l.autor_id = a.id
       WHERE l.id = ? AND l.ativo = 1
    `, [id]);
    if (!rows.length) return erroNaoEncontrado(res, 'Livro não encontrado.');
    return ok(res, { ...rows[0], disponivel: Boolean(rows[0].disponivel) }, 'Livro encontrado.');
  } catch (e) { return erroServidor(res, e); }
});

// POST /api/livros
router.post('/', autenticar, validarLivro, async (req: Request, res: Response) => {
  const { titulo, autor_id, isbn, ano, disponivel } = req.body as {
    titulo: string; autor_id: number; isbn?: string; ano?: number; disponivel?: number;
  };
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)',
      [titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel ?? 1]
    );
    return criado(res, { id: result.insertId }, 'Livro cadastrado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// PUT /api/livros/:id
router.put('/:id', autenticar, validarLivro, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, autor_id, isbn, ano, disponivel } = req.body as {
    titulo: string; autor_id: number; isbn?: string; ano?: number; disponivel?: number;
  };
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE livros SET titulo = ?, autor_id = ?, isbn = ?, ano = ?, disponivel = ? WHERE id = ? AND ativo = 1',
      [titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel ?? 1, id]
    );
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Livro não encontrado.');
    return ok(res, null, 'Livro atualizado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// DELETE /api/livros/:id
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE livros SET ativo = 0 WHERE id = ?', [id]
    );
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Livro não encontrado.');
    return ok(res, null, 'Livro excluído com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

export default router;
