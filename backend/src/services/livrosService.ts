import { livrosRepository, Livro } from '../repositories/livrosRepository';
import { AppError } from '../errors/AppError';

export const livrosService = {
  async findAll(): Promise<Livro[]> {
    return livrosRepository.findAll();
  },

  async findById(id: number): Promise<Livro> {
    const livro = await livrosRepository.findById(id);
    if (!livro) throw new AppError('Livro nao encontrado.', 404);
    return livro;
  },

  async create(titulo: string, autor_id: number, isbn?: string, ano?: number, disponivel = 1): Promise<{ id: number }> {
    const id = await livrosRepository.insert(
      titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel
    );
    return { id };
  },

  async update(id: number, titulo: string, autor_id: number, isbn?: string, ano?: number, disponivel = 1): Promise<void> {
    const found = await livrosRepository.update(
      id, titulo.trim(), autor_id, isbn?.trim() || null, ano || null, disponivel
    );
    if (!found) throw new AppError('Livro nao encontrado.', 404);
  },

  async delete(id: number): Promise<void> {
    const found = await livrosRepository.delete(id);
    if (!found) throw new AppError('Livro nao encontrado.', 404);
  },
};
