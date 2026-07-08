export interface IAuthApiClient {
  /**
   * Envía las credenciales y devuelve el JWT si son válidas.
   * @throws {InvalidCredentialsError} Si el servidor rechaza las credenciales.
   */
  login(email: string, password: string): Promise<string>;
}
