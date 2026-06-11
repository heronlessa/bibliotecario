import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Payload que ficará dentro do token
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

// middleware que valida se o usuário tá autenticado ao fazer requisição 
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'erro',
      mensagem: 'Acesso negado. Faça login para continuar.',
      data: null,
    });
  }

  const token  = authHeader.split(' ')[1];
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    return res.status(500).json({
      status: 'erro',
      mensagem: 'Configuração de segurança ausente no servidor.',
      data: null,
    });
  }

  try {
    const payload = jwt.verify(token, segredo) as TokenPayload;
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({
      status: 'erro',
      mensagem: 'Sessão expirada ou inválida. Faça login novamente.',
      data: null,
    });
  }
}
