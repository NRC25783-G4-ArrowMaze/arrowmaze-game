import { type IAuthApiClient } from '../ports/IAuthApiClient';
import { ValidationError } from '../errors/AuthErrors';
import { isValidEmail, validatePassword } from './credentialPolicy';

/**
 * RegisterUser — Crea una cuenta. Valida la política E1 ANTES de la red (falla
 * cerrado con ValidationError tipado) y delega el registro en la API. No guarda
 * token: el backend responde 201 sin token, así que no hay auto-login (el flujo
 * posterior es iniciar sesión).
 */
export class RegisterUser {
  private readonly _apiClient: IAuthApiClient;

  constructor(apiClient: IAuthApiClient) {
    this._apiClient = apiClient;
  }

  async execute(email: string, password: string): Promise<void> {
    if (!isValidEmail(email)) {
      throw new ValidationError('email');
    }
    if (!validatePassword(password)) {
      throw new ValidationError('password');
    }

    await this._apiClient.register(email, password);
  }
}
