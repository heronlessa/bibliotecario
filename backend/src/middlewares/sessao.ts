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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return erroNaoAutenticado(res);
  }

  const token  = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return erroServidor(res, 'Configuracao de seguranca ausente no servidor.');
  }

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    req.usuario = payload;
    next();
  } catch {
    return erroNaoAutenticado(res, 'Sessao expirada ou invalida. Faca login novamente.');
  }
}
