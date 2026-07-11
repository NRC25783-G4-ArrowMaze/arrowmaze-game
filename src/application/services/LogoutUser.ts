import { type IAuthApiClient } from '../ports/IAuthApiClient';
import { type IAuthTokenProvider } from '../ports/IAuthTokenProvider';

/**
 * LogoutUser — Cierra la sesión. Intenta revocar el token en el servidor
 * (blacklist del JTI) y SIEMPRE elimina el token local.
 *
 * Fail-open local: si la red falla, el token local se borra igual y la
 * operación no propaga el error — el usuario queda deslogueado en el cliente y
 * el JTI expira por sí solo en 7 días. Nunca se debe dejar al usuario atrapado
 * en un estado "logueado" por un fallo de red.
 */
export class LogoutUser {
  private readonly _apiClient: IAuthApiClient;
  private readonly _tokenProvider: IAuthTokenProvider;

  constructor(apiClient: IAuthApiClient, tokenProvider: IAuthTokenProvider) {
    this._apiClient = apiClient;
    this._tokenProvider = tokenProvider;
  }

  async execute(): Promise<void> {
    const token = await this._tokenProvider.getToken();

    try {
      if (token !== null) {
        await this._apiClient.logout(token);
      }
    } catch {
      // Fail-open local: la revocación remota falló (p.ej. sin red), pero el
      // cierre de sesión local procede igual.
    } finally {
      // El token y la identidad local mueren JUNTOS, incluso sin red.
      await this._tokenProvider.removeToken();
      await this._tokenProvider.removeEmail();
    }
  }
}
