import bcrypt from 'bcryptjs';
import { usuariosRepository } from '../repositories/usuariosRepository';
import { AppError } from '../errors/AppError';

export const usuariosService = {
  async findAll() {
    return usuariosRepository.findAll();
  },

  async findById(id: number) {
    const usuario = await usuariosRepository.findById(id);
    if (!usuario) throw new AppError('Usuario nao encontrado.', 404);
    return usuario;
  },

  async create(nome: string, email: string, senha: string) {
    const exists = await usuariosRepository.emailExists(email.trim());
    if (exists) throw new AppError('E-mail ja cadastrado.', 409);
    const hash = await bcrypt.hash(senha, 10);
    const id   = await usuariosRepository.insert(nome.trim(), email.trim(), hash);
    return { id };
  },

  async update(id: number, nome: string, email: string, senha?: string) {
    const duplicated = await usuariosRepository.emailExists(email.trim(), id);
    if (duplicated) throw new AppError('E-mail ja utilizado por outro usuario.', 409);
    const hash = senha ? await bcrypt.hash(senha, 10) : undefined;
    const found = await usuariosRepository.update(id, nome.trim(), email.trim(), hash);
    if (!found) throw new AppError('Usuario nao encontrado.', 404);
  },

  async delete(id: number) {
    const found = await usuariosRepository.delete(id);
    if (!found) throw new AppError('Usuario nao encontrado.', 404);
  },
};
