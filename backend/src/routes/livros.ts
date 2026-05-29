import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// GET /api/livros                     → lista todos
// GET /api/livros?id=X                → retorna um pelo ID
// GET /api/livros?id=X&acao=excluir   → exclui (soft delete)
router.get('/', async (req: Request, res: Response) => {
  const id   = req.query.id   as string | undefined;
  const acao = req.query.acao as string | undefined;

  if (id && acao === 'excluir') {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE livros SET ativo = 0 WHERE id = ?', [id]
      );
      if (!result.affectedRows) return erro(res, 'Livro não encontrado.', 404);
      return ok(res, null, 'Livro excluído com sucesso.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  if (id) {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(`
        SELECT l.*, a.nome AS autor_nome
          FROM livros l
          JOIN autores a ON l.autor_id = a.id
         WHERE l.id = ? AND l.ativo = 1
      `, [id]);
      if (!rows.length) return erro(res, 'Livro não encontrado.', 404);
      return ok(res, { ...rows[0], disponivel: Boolean(rows[0].disponivel) }, 'Livro encontrado.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT l.*, a.nome AS autor_nome
        FROM livros l
        JOIN autores a ON l.autor_id = a.id
       WHERE l.ativo = 1
       ORDER BY l.id ASC
    `);
    return ok(res, rows.map(r => ({ ...r, disponivel: Boolean(r.disponivel) })), 'Livros carregados.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/livros        → insere novo registro
// POST /api/livros?id=X   → atualiza registro existente
router.post('/', async (req: Request, res: Response) => {
  const id = req.query.id as string | undefined;
  const { titulo, autor_id, isbn, ano, disponivel } = req.body as {
    titulo?: string; autor_id?: number; isbn?: string; ano?: number; disponivel?: number;
  };

  if (!titulo?.trim()) return erro(res, 'Título é obrigatório.');
  if (!autor_id)       return erro(res, 'Autor é obrigatório.');

  if (id) {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE livros SET titulo = ?, autor_id = ?, isbn = ?, ano = ?, disponivel = ? WHERE id = ? AND ativo = 1',
        [titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel ?? 1, id]
      );
      if (!result.affectedRows) return erro(res, 'Livro não encontrado.', 404);
      return ok(res, null, 'Livro atualizado com sucesso.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO livros (titulo, autor_id, isbn, ano, disponivel) VALUES (?, ?, ?, ?, ?)',
      [titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel ?? 1]
    );
    return ok(res, { id: result.insertId }, 'Livro cadastrado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

export default router;
