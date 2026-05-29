import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// GET /api/autores                     → lista todos
// GET /api/autores?id=X                → retorna um
// GET /api/autores?id=X&acao=excluir   → exclui (soft delete)
router.get('/', async (req: Request, res: Response) => {
  const id   = req.query.id   as string | undefined;
  const acao = req.query.acao as string | undefined;

  if (id && acao === 'excluir') {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE autores SET ativo = 0 WHERE id = ?', [id]
      );
      if (!result.affectedRows) return erro(res, 'Autor não encontrado.', 404);
      return ok(res, null, 'Autor excluído com sucesso.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  if (id) {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM autores WHERE id = ? AND ativo = 1', [id]
      );
      if (!rows.length) return erro(res, 'Autor não encontrado.', 404);
      return ok(res, rows[0], 'Autor encontrado.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM autores WHERE ativo = 1 ORDER BY nome ASC'
    );
    return ok(res, rows, 'Autores carregados.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/autores        → insere
// POST /api/autores?id=X   → atualiza
router.post('/', async (req: Request, res: Response) => {
  const id = req.query.id as string | undefined;
  const { nome, nacionalidade } = req.body as { nome?: string; nacionalidade?: string };

  if (!nome?.trim()) return erro(res, 'Nome é obrigatório.');

  if (id) {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE autores SET nome = ?, nacionalidade = ? WHERE id = ? AND ativo = 1',
        [nome.trim(), nacionalidade?.trim() || null, id]
      );
      if (!result.affectedRows) return erro(res, 'Autor não encontrado.', 404);
      return ok(res, null, 'Autor atualizado com sucesso.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO autores (nome, nacionalidade) VALUES (?, ?)',
      [nome.trim(), nacionalidade?.trim() || null]
    );
    return ok(res, { id: result.insertId }, 'Autor cadastrado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

export default router;
