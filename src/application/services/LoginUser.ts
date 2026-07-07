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
    
    // 2. Lo guardamos en las preferencias del dispositivo
    await this._tokenProvider.setToken(token);
  }
}