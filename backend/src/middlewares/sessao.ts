import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { erroNaoAutenticado, erroServidor } from '../helpers/resposta';

export interface TokenPayload {
  id:    number;
  nome:  string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return erroNaoAutenticado(res);
  }

  const token   = authHeader.split(' ')[1];
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    return erroServidor(res, 'Configuração de segurança ausente no servidor.');
  }

  try {
    const payload = jwt.verify(token, segredo) as TokenPayload;
    req.usuario = payload;
    next();
  } catch {
    return erroNaoAutenticado(res, 'Sessão expirada ou inválida. Faça login novamente.');
  }
}
