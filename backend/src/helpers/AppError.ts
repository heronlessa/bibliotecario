/** Erro com semântica HTTP. Lançado nos services, capturado nos controllers. */
export class AppError extends Error {
  constructor(
    public readonly mensagem: string,
    public readonly statusCode: number = 400,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}
