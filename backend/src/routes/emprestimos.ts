import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import { autenticar } from '../middlewares/sessao';
import { validarEmprestimo } from '../middlewares/validacao';
import { ok, criado, erroNaoEncontrado, erroNegocio, erroServidor } from '../helpers/resposta';

const router = Router();

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
  } catch (e) { return erroServidor(res, e); }
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
    if (!rows.length) return erroNaoEncontrado(res, 'Empréstimo não encontrado.');
    return ok(res, rows[0], 'Empréstimo encontrado.');
  } catch (e) { return erroServidor(res, e); }
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
    if (!livro.length)        return erroNaoEncontrado(res, 'Livro não encontrado.');
    if (!livro[0].disponivel) return erroNegocio(res, 'Livro não está disponível para empréstimo.');

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO emprestimos (livro_id, usuario_id, data_saida, data_prevista) VALUES (?, ?, ?, ?)',
      [livro_id, usuario_id, data_saida, data_prevista]
    );
    await pool.execute('UPDATE livros SET disponivel = 0 WHERE id = ?', [livro_id]);
    return criado(res, { id: result.insertId }, 'Empréstimo registrado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
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
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Empréstimo não encontrado.');
    return ok(res, null, 'Empréstimo atualizado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// PATCH /api/emprestimos/:id/devolver 
router.patch('/:id/devolver', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT livro_id, data_devolucao FROM emprestimos WHERE id = ? AND ativo = 1', [id]
    );
    if (!rows.length)           return erroNaoEncontrado(res, 'Empréstimo não encontrado.');
    if (rows[0].data_devolucao) return erroNegocio(res, 'Livro já foi devolvido.');

    const hoje = new Date().toISOString().slice(0, 10);
    await pool.execute('UPDATE emprestimos SET data_devolucao = ? WHERE id = ?', [hoje, id]);
    await pool.execute('UPDATE livros SET disponivel = 1 WHERE id = ?', [rows[0].livro_id]);
    return ok(res, null, 'Devolução registrada com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// DELETE /api/emprestimos/:id 
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE emprestimos SET ativo = 0 WHERE id = ?', [id]
    );
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Empréstimo não encontrado.');
    return ok(res, null, 'Empréstimo excluído com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

export default router;
