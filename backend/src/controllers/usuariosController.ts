import { Request, Response } from 'express';
import { usuariosService } from '../services/usuariosService';
import { ok, criado, handleController } from '../helpers/resposta';

export const usuariosController = {
  list: handleController(async (_req: Request, res: Response) => {
    const data = await usuariosService.findAll();
    ok(res, data, 'Usuarios listados com sucesso.');
  }),

  findById: handleController(async (req: Request, res: Response) => {
    const data = await usuariosService.findById(Number(req.params.id));
    ok(res, data, 'Usuario encontrado.');
  }),

  create: handleController(async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body;
    const data = await usuariosService.create(nome, email, senha);
    criado(res, data, 'Usuario criado com sucesso.');
  }),

  update: handleController(async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body;
    await usuariosService.update(Number(req.params.id), nome, email, senha);
    ok(res, null, 'Usuario atualizado com sucesso.');
  }),

  remove: handleController(async (req: Request, res: Response) => {
    await usuariosService.delete(Number(req.params.id));
    ok(res, null, 'Usuario removido com sucesso.');
  }),
};
