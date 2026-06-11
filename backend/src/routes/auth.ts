import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { validarLogin } from '../middlewares/validacao';
import { ok, erroNaoAutenticado, erroServidor } from '../helpers/resposta';

const router = Router();

// POST /api/auth/login
router.post('/login', validarLogin, async (req: Request, res: Response) => {
  const { email, senha } = req.body as { email: string; senha: string };

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = ? AND ativo = 1',
      [email.trim()]
    );

    if (!rows.length) return erroNaoAutenticado(res, 'E-mail ou senha inválidos.');

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return erroNaoAutenticado(res, 'E-mail ou senha inválidos.');

    const segredo = process.env.JWT_SECRET;
    if (!segredo) return erroServidor(res, 'Configuração de segurança ausente no servidor.');

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      segredo,
      { expiresIn: '8h' }
    );

    return ok(res, { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } }, 'Login realizado com sucesso.');
  } catch (e) { return erroServidor(res, e); }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  return ok(res, null, 'Logout realizado.');
});

export default router;
