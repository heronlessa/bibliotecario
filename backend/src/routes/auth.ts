import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { validarLogin } from '../middlewares/validacao';

const router = Router();

const ok   = (res: Response, data: unknown, msg: string) => res.json({ status: 'ok',   mensagem: msg, data });
const erro = (res: Response, msg: string, code = 400)    => res.status(code).json({ status: 'erro', mensagem: msg, data: null });

// POST /api/auth/login
router.post('/login', validarLogin, async (req: Request, res: Response) => {
  const { email, senha } = req.body as { email: string; senha: string };

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = ? AND ativo = 1',
      [email.trim()]
    );

    if (!rows.length) return erro(res, 'E-mail ou senha inválidos.', 401);

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return erro(res, 'E-mail ou senha inválidos.', 401);

    const segredo = process.env.JWT_SECRET;
    if (!segredo) return erro(res, 'Configuração de segurança ausente no servidor.', 500);

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      segredo,
      { expiresIn: '8h' }
    );

    return ok(res, { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } }, 'Login realizado com sucesso.');
  } catch (e) { return erro(res, String(e), 500); }
});

// POST /api/auth/logout  (apenas sinalização — o token é descartado pelo front)
router.post('/logout', (_req: Request, res: Response) => {
  return ok(res, null, 'Logout realizado.');
});

export default router;
