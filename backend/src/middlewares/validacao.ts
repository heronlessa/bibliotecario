import { Request, Response, NextFunction } from 'express';

const erro = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ status: 'erro', mensagem: msg, data: null });

export function validarLogin(req: Request, res: Response, next: NextFunction) {
  const { email, senha } = req.body as { email?: string; senha?: string };
  if (!email?.trim())                               return erro(res, 'E-mail é obrigatório.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))  return erro(res, 'E-mail inválido.');
  if (!senha)                                       return erro(res, 'Senha é obrigatória.');
  next();
}

export function validarAutor(req: Request, res: Response, next: NextFunction) {
  const { nome } = req.body as { nome?: string };
  if (!nome?.trim()) return erro(res, 'Nome é obrigatório.');
  next();
}

export function validarLivro(req: Request, res: Response, next: NextFunction) {
  const { titulo, autor_id } = req.body as { titulo?: string; autor_id?: number };
  if (!titulo?.trim()) return erro(res, 'Título é obrigatório.');
  if (!autor_id)       return erro(res, 'Autor é obrigatório.');
  next();
}

export function validarUsuario(req: Request, res: Response, next: NextFunction) {
  const id    = req.query.id as string | undefined; // edição
  const { nome, email, senha } = req.body as { nome?: string; email?: string; senha?: string };

  if (!nome?.trim())                               return erro(res, 'Nome é obrigatório.');
  if (!email?.trim())                              return erro(res, 'E-mail é obrigatório.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 'E-mail inválido.');

  // Senha obrigatória apenas no cadastro; opcional na edição
  if (!id) {
    if (!senha)          return erro(res, 'Senha é obrigatória.');
    if (senha.length < 6) return erro(res, 'Senha deve ter no mínimo 6 caracteres.');
  } else if (senha && senha.length < 6) {
    return erro(res, 'Senha deve ter no mínimo 6 caracteres.');
  }

  next();
}

export function validarEmprestimo(req: Request, res: Response, next: NextFunction) {
  const { livro_id, usuario_id, data_saida, data_prevista } = req.body as {
    livro_id?: number; usuario_id?: number; data_saida?: string; data_prevista?: string;
  };

  if (!livro_id)      return erro(res, 'Livro é obrigatório.');
  if (!usuario_id)    return erro(res, 'Usuário é obrigatório.');
  if (!data_saida)    return erro(res, 'Data de saída é obrigatória.');
  if (!data_prevista) return erro(res, 'Data prevista de devolução é obrigatória.');

  const saida    = new Date(data_saida);
  const prevista = new Date(data_prevista);
  if (isNaN(saida.getTime()))    return erro(res, 'Data de saída inválida.');
  if (isNaN(prevista.getTime())) return erro(res, 'Data prevista inválida.');
  if (prevista <= saida)         return erro(res, 'Data prevista deve ser posterior à data de saída.');

  next();
}
