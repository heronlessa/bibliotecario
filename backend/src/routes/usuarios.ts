import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// GET /api/usuarios                     → lista todos
// GET /api/usuarios?id=X                → retorna um pelo ID
// GET /api/usuarios?id=X&acao=excluir   → exclui (soft delete)
router.get('/', async (req: Request, res: Response) => {
  const id   = req.query.id   as string | undefined;
  const acao = req.query.acao as string | undefined;

  if (id && acao === 'excluir') {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]
      );
      if (!result.affectedRows) return erro(res, 'Usuário não encontrado.', 404);
      return ok(res, null, 'Usuário excluído com sucesso.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  if (id) {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, nome, email, ativo FROM usuarios WHERE id = ? AND ativo = 1', [id]
      );
      if (!rows.length) return erro(res, 'Usuário não encontrado.', 404);
      return ok(res, rows[0], 'Usuário encontrado.');
    } catch (e) { return erro(res, String(e), 500); }
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome, email, ativo FROM usuarios WHERE ativo = 1 ORDER BY id ASC'
    );
    return ok(res, rows, 'Usuários carregados.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/usuarios        → insere novo registro
// POST /api/usuarios?id=X   → atualiza registro existente
router.post('/', async (req: Request, res: Response) => {
  const id = req.query.id as string | undefined;
  const { nome, email, senha } = req.body as { nome?: string; email?: string; senha?: string };

  if (!nome?.trim())  return erro(res, 'Nome é obrigatório.');
  if (!email?.trim()) return erro(res, 'E-mail é obrigatório.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 'E-mail inválido.');

  if (id) {
    if (senha && senha.length < 6) return erro(res, 'A senha deve ter no mínimo 6 caracteres.');
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
  }

  if (!senha)           return erro(res, 'Senha é obrigatória.');
  if (senha.length < 6) return erro(res, 'A senha deve ter no mínimo 6 caracteres.');

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

export default router;
