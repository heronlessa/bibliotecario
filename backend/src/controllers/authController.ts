import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { ok, handleController } from '../helpers/resposta';

export const authController = {
  login: handleController(async (req: Request, res: Response) => {
    const { email, senha } = req.body;
    const data = await authService.login(email, senha);
    return ok(res, data, 'Login realizado com sucesso.');
  }),

  logout: (_req: Request, res: Response) => {
    return ok(res, null, 'Logout realizado.');
  },
};
