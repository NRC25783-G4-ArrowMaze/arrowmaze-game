export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Correo o contraseña incorrectos') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}