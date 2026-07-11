export interface IAuthApiClient {
  /**
   * Envía las credenciales y devuelve el JWT si son válidas.
   * @throws {InvalidCredentialsError} Si el servidor rechaza las credenciales.
   */
  login(email: string, password: string): Promise<string>;

  /**
   * Registra una cuenta nueva. El backend responde 201 sin token (no hay
   * auto-login): el flujo posterior es iniciar sesión.
   * @throws {EmailAlreadyInUseError} Si el email ya está registrado (409).
   */
  register(email: string, password: string): Promise<void>;

  /**
   * Cierra la sesión en el servidor: el JTI del token se añade a la blacklist.
   * @throws {NetworkError} Si falla la comunicación (el caller decide fail-open).
   */
  logout(token: string): Promise<void>;
}
