import { type IAuthApiClient } from '../ports/IAuthApiClient';
import { type IAuthTokenProvider } from '../ports/IAuthTokenProvider';

export class LoginUser {
  private readonly _apiClient: IAuthApiClient;
  private readonly _tokenProvider: IAuthTokenProvider;

  constructor(apiClient: IAuthApiClient, tokenProvider: IAuthTokenProvider) {
    this._apiClient = apiClient;
    this._tokenProvider = tokenProvider;
  }

  async execute(email: string, password: string): Promise<void> {
    // 1. Obtenemos el token de la API
    const token = await this._apiClient.login(email, password);

    // 2. Persistimos la sesión SOLO tras el login exitoso: el token y, como
    //    identidad del badge, el email tecleado (jamás la contraseña). Si el
    //    login lanzó arriba, nada de esto se ejecuta.
    await this._tokenProvider.setToken(token);
    await this._tokenProvider.setEmail(email);
  }
}
