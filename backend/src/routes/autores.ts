import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import { autenticar } from '../middlewares/sessao';
import { validarAutor } from '../middlewares/validacao';
import { ok, criado, erroNaoEncontrado, erroServidor } from '../helpers/resposta';

const router = Router();

// GET /api/autores → lista todos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM autores WHERE ativo = 1 ORDER BY nome ASC'
    );
    return ok(res, rows, 'Autores carregados.');
  } catch (e) { return erroServidor(res, e); }
});

// GET /api/autores/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM autores WHERE id = ? AND ativo = 1', [id]
    );
    if (!rows.length) return erroNaoEncontrado(res, 'Autor não encontrado.');
    return ok(res, rows[0], 'Autor encontrado.');
  } catch (e) { return erroServidor(res, e); }
});

// POST /api/autores
router.post('/', autenticar, validarAutor, async (req: Request, res: Response) => {
  const { nome, nacionalidade } = req.body as { nome: string; nacionalidade?: string };
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO autores (nome, nacionalidade) VALUES (?, ?)',
      [nome.trim(), nacionalidade?.trim() || null]
    );
    return criado(res, { id: result.insertId }, 'Autor cadastrado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// PUT /api/autores/:id
router.put('/:id', autenticar, validarAutor, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, nacionalidade } = req.body as { nome: string; nacionalidade?: string };
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE autores SET nome = ?, nacionalidade = ? WHERE id = ? AND ativo = 1',
      [nome.trim(), nacionalidade?.trim() || null, id]
    );
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Autor não encontrado.');
    return ok(res, null, 'Autor atualizado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// DELETE /api/autores/:id → soft delete
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE autores SET ativo = 0 WHERE id = ?', [id]
    );
    if (!result.affectedRows) return erroNaoEncontrado(res, 'Autor não encontrado.');
    return ok(res, null, 'Autor excluído com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

export default router;
