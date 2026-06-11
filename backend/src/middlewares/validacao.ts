import { Request, Response, NextFunction } from 'express';

const erro = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ status: 'erro', mensagem: msg, data: null });

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, senha } = req.body as { email?: string; senha?: string };
  if (!email?.trim())                              return erro(res, 'E-mail e obrigatorio.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 'E-mail invalido.');
  if (!senha)                                      return erro(res, 'Senha e obrigatoria.');
  next();
}

export function validateAuthor(req: Request, res: Response, next: NextFunction) {
  const { nome } = req.body as { nome?: string };
  if (!nome?.trim()) return erro(res, 'Nome e obrigatorio.');
  next();
}

export function validateBook(req: Request, res: Response, next: NextFunction) {
  const { titulo, autor_id } = req.body as { titulo?: string; autor_id?: number };
  if (!titulo?.trim()) return erro(res, 'Titulo e obrigatorio.');
  if (!autor_id)       return erro(res, 'Autor e obrigatorio.');
  next();
}

export function validateUser(req: Request, res: Response, next: NextFunction) {
  const id  = req.params.id;
  const { nome, email, senha } = req.body as { nome?: string; email?: string; senha?: string };

  if (!nome?.trim())                               return erro(res, 'Nome e obrigatorio.');
  if (!email?.trim())                              return erro(res, 'E-mail e obrigatorio.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 'E-mail invalido.');

  if (!id) {
    if (!senha)           return erro(res, 'Senha e obrigatoria.');
    if (senha.length < 6) return erro(res, 'Senha deve ter no minimo 6 caracteres.');
  } else if (senha && senha.length < 6) {
    return erro(res, 'Senha deve ter no minimo 6 caracteres.');
  }

  next();
}

export function validateLoan(req: Request, res: Response, next: NextFunction) {
  const { livro_id, usuario_id, data_saida, data_prevista } = req.body as {
    livro_id?: number; usuario_id?: number; data_saida?: string; data_prevista?: string;
  };

  if (!livro_id)      return erro(res, 'Livro e obrigatorio.');
  if (!usuario_id)    return erro(res, 'Usuario e obrigatorio.');
  if (!data_saida)    return erro(res, 'Data de saida e obrigatoria.');
  if (!data_prevista) return erro(res, 'Data prevista de devolucao e obrigatoria.');

  const saida    = new Date(data_saida);
  const prevista = new Date(data_prevista);
  if (isNaN(saida.getTime()))    return erro(res, 'Data de saida invalida.');
  if (isNaN(prevista.getTime())) return erro(res, 'Data prevista invalida.');
  if (prevista <= saida)         return erro(res, 'Data prevista deve ser posterior a data de saida.');

  next();
}
