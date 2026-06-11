import { autoresRepository, Autor } from '../repositories/autoresRepository';
import { AppError } from '../errors/AppError';

export const autoresService = {
  async findAll(): Promise<Autor[]> {
    return autoresRepository.findAll();
  },

  async findById(id: number): Promise<Autor> {
    const autor = await autoresRepository.findById(id);
    if (!autor) throw new AppError('Autor nao encontrado.', 404);
    return autor;
  },

  async create(nome: string, nacionalidade?: string): Promise<{ id: number }> {
    const id = await autoresRepository.insert(nome.trim(), nacionalidade?.trim() || null);
    return { id };
  },

  async update(id: number, nome: string, nacionalidade?: string): Promise<void> {
    const found = await autoresRepository.update(id, nome.trim(), nacionalidade?.trim() || null);
    if (!found) throw new AppError('Autor nao encontrado.', 404);
  },

  async delete(id: number): Promise<void> {
    const found = await autoresRepository.delete(id);
    if (!found) throw new AppError('Autor nao encontrado.', 404);
  },
};
