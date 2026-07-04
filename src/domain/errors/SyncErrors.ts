export class SessionExpiredError extends Error {
  constructor(message: string = 'La sesión del usuario ha expirado') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Error de red o comunicación con el servidor') {
    super(message);
    this.name = 'NetworkError';
  }
}