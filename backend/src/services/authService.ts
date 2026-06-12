import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usuariosRepository } from '../repositories/usuariosRepository';
import { AppError } from '../errors/AppError';

export const authService = {
  async login(email: string, senha: string) {
    const usuario = await usuariosRepository.findByEmail(email.trim());
    if (!usuario) throw new AppError('E-mail ou senha invalidos.', 401);

    const hash = String(usuario.senha).replace(/^\$2y\$/, '$2a$');
    const passwordOk = await bcrypt.compare(senha, hash);
    if (!passwordOk) throw new AppError('E-mail ou senha invalidos.', 401);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('Configuracao de seguranca ausente no servidor.', 500);

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      secret,
      { expiresIn: '8h' }
    );

    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } };
  },
};
