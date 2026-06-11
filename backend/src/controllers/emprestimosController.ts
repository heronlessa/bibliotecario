import { Request, Response } from 'express';
import { emprestimosService } from '../services/emprestimosService';
import { ok, criado, handleController } from '../helpers/resposta';

export const emprestimosController = {
  list: handleController(async (_req: Request, res: Response) => {
    const data = await emprestimosService.findAll();
    ok(res, data, 'Emprestimos listados com sucesso.');
  }),

  findById: handleController(async (req: Request, res: Response) => {
    const data = await emprestimosService.findById(Number(req.params.id));
    ok(res, data, 'Emprestimo encontrado.');
  }),

  create: handleController(async (req: Request, res: Response) => {
    const { livro_id, usuario_id, data_saida, data_prevista } = req.body;
    const data = await emprestimosService.create(livro_id, usuario_id, data_saida, data_prevista);
    criado(res, data, 'Emprestimo criado com sucesso.');
  }),

  update: handleController(async (req: Request, res: Response) => {
    const { livro_id, usuario_id, data_saida, data_prevista } = req.body;
    await emprestimosService.update(Number(req.params.id), livro_id, usuario_id, data_saida, data_prevista);
    ok(res, null, 'Emprestimo atualizado com sucesso.');
  }),

  return: handleController(async (req: Request, res: Response) => {
    await emprestimosService.return(Number(req.params.id));
    ok(res, null, 'Livro devolvido com sucesso.');
  }),

  remove: handleController(async (req: Request, res: Response) => {
    await emprestimosService.delete(Number(req.params.id));
    ok(res, null, 'Emprestimo removido com sucesso.');
  }),
};
