/**
 * Erro de aplicação com status HTTP.
 * Lançado nas camadas de Service para sinalizar
 * violações de regra de negócio ao Controller.
 */
export class AppError extends Error {
  constructor(
    public readonly mensagem: string,
    public readonly statusCode: number = 400,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}
