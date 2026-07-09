export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Correo o contraseña incorrectos') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/** Campo de credencial que incumple la política E1. */
export type CredentialField = 'email' | 'password';

/**
 * Mensajes literales de la política E1 (fuente de verdad para el backend y los
 * specs). La UI NO muestra estos textos: mapea por `field`/tipo a i18n.
 */
export const VALIDATION_MESSAGES: Record<CredentialField, string> = {
  email: 'invalid email format',
  password: 'password must contain at least 8 characters, 1 number, and 1 uppercase letter',
};

/** Credencial que no cumple la política E1 (rechazada antes de la red). */
export class ValidationError extends Error {
  readonly field: CredentialField;

  constructor(field: CredentialField) {
    super(VALIDATION_MESSAGES[field]);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/** El email ya está registrado en el sistema (backend 409 en /register). */
export class EmailAlreadyInUseError extends Error {
  constructor(message: string = 'email is already in use') {
    super(message);
    this.name = 'EmailAlreadyInUseError';
  }
}
