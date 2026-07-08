import { type IAuthApiClient } from '../../application/ports/IAuthApiClient';
import { InvalidCredentialsError } from '../../application/errors/AuthErrors';
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
}
