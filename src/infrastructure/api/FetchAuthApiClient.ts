import { type IAuthApiClient } from '../../application/ports/IAuthApiClient';
import { InvalidCredentialsError, ValidationError, EmailAlreadyInUseError } from '../../application/errors/AuthErrors';
import { NetworkError } from '../../domain/errors/SyncErrors';

// DTO estricto, sin banderas de estado redundantes
interface LoginResponseDTO {
  token: string;
}

export class FetchAuthApiClient implements IAuthApiClient {
  private readonly _baseUrl: string;

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<string> {
    try {
      const response = await fetch(`${this._baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        throw new InvalidCredentialsError();
      }

      if (!response.ok) {
        throw new NetworkError(`Error HTTP al intentar iniciar sesión: ${response.status}`);
      }

      const data = (await response.json()) as LoginResponseDTO;
      
      // Validación extra de seguridad (Type Guard en tiempo de ejecución)
      if (!data.token) {
        throw new Error('El servidor respondió correctamente pero omitió el token en el payload');
      }

      return data.token;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw error; // Propagamos el error de credenciales hacia la UI
      }
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this._baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // 409: email duplicado (E1/F1).
      if (response.status === 409) {
        throw new EmailAlreadyInUseError();
      }

      // 400: la política del backend rechazó el payload. El cliente ya valida
      // email y password antes de llegar aquí; el único 400 realista es la
      // política de contraseña (el email inválido se corta en cliente y el
      // duplicado es 409), de ahí el mapeo a ValidationError('password').
      if (response.status === 400) {
        throw new ValidationError('password');
      }

      if (!response.ok) {
        throw new NetworkError(`Error HTTP al intentar registrar la cuenta: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) throw error;
      if (error instanceof ValidationError) throw error;
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${this._baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`Error HTTP al cerrar sesión: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    }
  }
}
