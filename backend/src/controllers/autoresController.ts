import { Request, Response } from 'express';
import { autoresService } from '../services/autoresService';
import { ok, criado, handleController } from '../helpers/resposta';

export const autoresController = {
  list: handleController(async (_req: Request, res: Response) => {
    const data = await autoresService.findAll();
    ok(res, data, 'Autores listados com sucesso.');
  }),

  findById: handleController(async (req: Request, res: Response) => {
    const data = await autoresService.findById(Number(req.params.id));
    ok(res, data, 'Autor encontrado.');
  }),

  create: handleController(async (req: Request, res: Response) => {
    const { nome, nacionalidade } = req.body;
    const data = await autoresService.create(nome, nacionalidade);
    criado(res, data, 'Autor criado com sucesso.');
  }),

  update: handleController(async (req: Request, res: Response) => {
    const { nome, nacionalidade } = req.body;
    await autoresService.update(Number(req.params.id), nome, nacionalidade);
    ok(res, null, 'Autor atualizado com sucesso.');
  }),

  remove: handleController(async (req: Request, res: Response) => {
    await autoresService.delete(Number(req.params.id));
    ok(res, null, 'Autor removido com sucesso.');
  }),
};
