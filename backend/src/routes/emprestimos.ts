import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import { autenticar } from '../middlewares/sessao';
import { validarEmprestimo } from '../middlewares/validacao';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// GET /api/emprestimos 
router.get('/', autenticar, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT e.*,
             l.titulo   AS livro_titulo,
             u.nome     AS usuario_nome
        FROM emprestimos e
        JOIN livros   l ON e.livro_id   = l.id
        JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.ativo = 1
       ORDER BY e.id DESC
    `);
    return ok(res, rows, 'Empréstimos carregados.');
  } catch (e) { return erro(res, String(e), 500); }
});

// GET /api/emprestimos/:id
router.get('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT e.*,
             l.titulo   AS livro_titulo,
             u.nome     AS usuario_nome
        FROM emprestimos e
        JOIN livros   l ON e.livro_id   = l.id
        JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.id = ? AND e.ativo = 1
    `, [id]);
    if (!rows.length) return erro(res, 'Empréstimo não encontrado.', 404);
    return ok(res, rows[0], 'Empréstimo encontrado.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/emprestimos 
router.post('/', autenticar, validarEmprestimo, async (req: Request, res: Response) => {
  const { livro_id, usuario_id, data_saida, data_prevista } = req.body as {
    livro_id: number; usuario_id: number; data_saida: string; data_prevista: string;
  };
  try {
    const [livro] = await pool.execute<RowDataPacket[]>(
      'SELECT disponivel FROM livros WHERE id = ? AND ativo = 1', [livro_id]
    );
    if (!livro.length)        return erro(res, 'Livro não encontrado.', 404);
    if (!livro[0].disponivel) return erro(res, 'Livro não está disponível para empréstimo.');

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO emprestimos (livro_id, usuario_id, data_saida, data_prevista) VALUES (?, ?, ?, ?)',
      [livro_id, usuario_id, data_saida, data_prevista]
    );
    await pool.execute('UPDATE livros SET disponivel = 0 WHERE id = ?', [livro_id]);
    return ok(res, { id: result.insertId }, 'Empréstimo registrado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// PUT /api/emprestimos/:id 
router.put('/:id', autenticar, validarEmprestimo, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { livro_id, usuario_id, data_saida, data_prevista } = req.body as {
    livro_id: number; usuario_id: number; data_saida: string; data_prevista: string;
  };
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET livro_id = ?, usuario_id = ?, data_saida = ?, data_prevista = ? WHERE id = ? AND ativo = 1',
      [livro_id, usuario_id, data_saida, data_prevista, id]
    );
    if (!result.affectedRows) return erro(res, 'Empréstimo não encontrado.', 404);
    return ok(res, null, 'Empréstimo atualizado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// PATCH /api/emprestimos/:id/devolver 
router.patch('/:id/devolver', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT livro_id, data_devolucao FROM emprestimos WHERE id = ? AND ativo = 1', [id]
    );
    if (!rows.length)           return erro(res, 'Empréstimo não encontrado.', 404);
    if (rows[0].data_devolucao) return erro(res, 'Livro já foi devolvido.');

    const hoje = new Date().toISOString().slice(0, 10);
    await pool.execute('UPDATE emprestimos SET data_devolucao = ? WHERE id = ?', [hoje, id]);
    await pool.execute('UPDATE livros SET disponivel = 1 WHERE id = ?', [rows[0].livro_id]);
    return ok(res, null, 'Devolução registrada com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// DELETE /api/emprestimos/:id 
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET ativo = 0 WHERE id = ?', [id]
    );
    if (!result.affectedRows) return erro(res, 'Empréstimo não encontrado.', 404);
    return ok(res, null, 'Empréstimo excluído com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

export default router;
