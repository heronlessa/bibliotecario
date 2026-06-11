import { Request, Response } from 'express';
import { livrosService } from '../services/livrosService';
import { ok, criado, handleController } from '../helpers/resposta';

export const livrosController = {
  list: handleController(async (_req: Request, res: Response) => {
    const data = await livrosService.findAll();
    ok(res, data, 'Livros listados com sucesso.');
  }),

  findById: handleController(async (req: Request, res: Response) => {
    const data = await livrosService.findById(Number(req.params.id));
    ok(res, data, 'Livro encontrado.');
  }),

  create: handleController(async (req: Request, res: Response) => {
    const { titulo, autor_id, isbn, ano, disponivel } = req.body;
    const data = await livrosService.create(titulo, autor_id, isbn, ano, disponivel);
    criado(res, data, 'Livro criado com sucesso.');
  }),

  update: handleController(async (req: Request, res: Response) => {
    const { titulo, autor_id, isbn, ano, disponivel } = req.body;
    await livrosService.update(Number(req.params.id), titulo, autor_id, isbn, ano, disponivel);
    ok(res, null, 'Livro atualizado com sucesso.');
  }),

  remove: handleController(async (req: Request, res: Response) => {
    await livrosService.delete(Number(req.params.id));
    ok(res, null, 'Livro removido com sucesso.');
  }),
};
