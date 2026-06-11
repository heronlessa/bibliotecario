import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { autenticar } from '../middlewares/sessao';
import { validarUsuario } from '../middlewares/validacao';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// GET /api/usuarios → lista todos
router.get('/', autenticar, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome, email, ativo FROM usuarios WHERE ativo = 1 ORDER BY id ASC'
    );
    return ok(res, rows, 'Usuários carregados.');
  } catch (e) { return erro(res, String(e), 500); }
});

// GET /api/usuarios/:id 
router.get('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nome, email, ativo FROM usuarios WHERE id = ? AND ativo = 1', [id]
    );
    if (!rows.length) return erro(res, 'Usuário não encontrado.', 404);
    return ok(res, rows[0], 'Usuário encontrado.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/usuarios 
router.post('/', autenticar, validarUsuario, async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body as { nome: string; email: string; senha: string };
  try {
    const [exist] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE email = ? AND ativo = 1', [email.trim()]
    );
    if (exist.length) return erro(res, 'E-mail já cadastrado.');

    const hash = await bcrypt.hash(senha, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome.trim(), email.trim(), hash]
    );
    return ok(res, { id: result.insertId }, 'Usuário cadastrado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// PUT /api/usuarios/:id
router.put('/:id', autenticar, validarUsuario, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body as { nome: string; email: string; senha?: string };
  try {
    const [dup] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE email = ? AND id != ? AND ativo = 1',
      [email.trim(), id]
    );
    if (dup.length) return erro(res, 'E-mail já utilizado por outro usuário.');

    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      await pool.execute(
        'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ? AND ativo = 1',
        [nome.trim(), email.trim(), hash, id]
      );
    } else {
      await pool.execute(
        'UPDATE usuarios SET nome = ?, email = ? WHERE id = ? AND ativo = 1',
        [nome.trim(), email.trim(), id]
      );
    }
    return ok(res, null, 'Usuário atualizado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// DELETE /api/usuarios/:id
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]
    );
    if (!result.affectedRows) return erro(res, 'Usuário não encontrado.', 404);
    return ok(res, null, 'Usuário excluído com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

export default router;
