import { emprestimosRepository, Emprestimo } from '../repositories/emprestimosRepository';
import { livrosRepository } from '../repositories/livrosRepository';
import { AppError } from '../errors/AppError';

export const emprestimosService = {
  async findAll(): Promise<Emprestimo[]> {
    return emprestimosRepository.findAll();
  },

  async findById(id: number): Promise<Emprestimo> {
    const emp = await emprestimosRepository.findById(id);
    if (!emp) throw new AppError('Emprestimo nao encontrado.', 404);
    return emp;
  },

  async create(livro_id: number, usuario_id: number, data_saida: string, data_prevista: string): Promise<{ id: number }> {
    const livro = await livrosRepository.findById(livro_id);
    if (!livro)            throw new AppError('Livro nao encontrado.', 404);
    if (!livro.disponivel) throw new AppError('Livro nao esta disponivel para emprestimo.', 422);
    const id = await emprestimosRepository.insert(livro_id, usuario_id, data_saida, data_prevista);
    await livrosRepository.updateAvailability(livro_id, false);
    return { id };
  },

  async update(id: number, livro_id: number, usuario_id: number, data_saida: string, data_prevista: string): Promise<void> {
    const found = await emprestimosRepository.update(id, livro_id, usuario_id, data_saida, data_prevista);
    if (!found) throw new AppError('Emprestimo nao encontrado.', 404);
  },

  async return(id: number): Promise<void> {
    const emp = await emprestimosRepository.findById(id);
    if (!emp)               throw new AppError('Emprestimo nao encontrado.', 404);
    if (emp.data_devolucao) throw new AppError('Livro ja foi devolvido.', 422);
    const today = new Date().toISOString().slice(0, 10);
    await emprestimosRepository.registerReturn(id, today);
    await livrosRepository.updateAvailability(emp.livro_id, true);
  },

  async delete(id: number): Promise<void> {
    const found = await emprestimosRepository.delete(id);
    if (!found) throw new AppError('Emprestimo nao encontrado.', 404);
  },
};
