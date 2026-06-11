import { Response } from 'express';

//Sucesso
export const ok = (res: Response, data: unknown, mensagem: string) =>
  res.status(200).json({ status: 'ok', mensagem, data });

export const criado = (res: Response, data: unknown, mensagem: string) =>
  res.status(201).json({ status: 'ok', mensagem, data });

//Erros cliente
export const erroBadRequest = (res: Response, mensagem: string) =>
  res.status(400).json({ status: 'erro', mensagem, data: null });

export const erroNaoAutenticado = (res: Response, mensagem = 'Não autenticado. Faça login para continuar.') =>
  res.status(401).json({ status: 'erro', mensagem, data: null });

export const erroProibido = (res: Response, mensagem = 'Acesso negado.') =>
  res.status(403).json({ status: 'erro', mensagem, data: null });

export const erroNaoEncontrado = (res: Response, mensagem = 'Recurso não encontrado.') =>
  res.status(404).json({ status: 'erro', mensagem, data: null });

export const erroConflito = (res: Response, mensagem: string) =>
  res.status(409).json({ status: 'erro', mensagem, data: null });

export const erroNegocio = (res: Response, mensagem: string) =>
  res.status(422).json({ status: 'erro', mensagem, data: null });

//Erro servidor
export const erroServidor = (res: Response, e: unknown) =>
  res.status(500).json({ status: 'erro', mensagem: String(e), data: null });
