export interface IAuthTokenProvider {
  /**
   * Obtiene el JWT actual de la sesión. Retorna null si el usuario no está logueado.
   */
  getToken(): Promise<string | null>;

  /**
   * Almacena el JWT de forma segura tras un inicio de sesión exitoso.
   */
  setToken(token: string): Promise<void>;

  /**
   * Elimina el JWT almacenado (para cierre de sesión o revocación por 401).
   */
  removeToken(): Promise<void>;

  /**
   * Email de la sesión activa (identidad para el badge del header). Retorna null
   * si no hay sesión o si es una sesión previa a este feature (migración). Solo
   * se guarda el email que el propio usuario tecleó; nunca password ni token.
   */
  getEmail(): Promise<string | null>;

  /**
   * Almacena el email tras un login EXITOSO (misma vida que el token de sesión).
   */
  setEmail(email: string): Promise<void>;

  /**
   * Elimina el email almacenado (cierre de sesión o revocación por 401). Se
   * limpia SIEMPRE junto con el token, incluido el camino fail-open del logout.
   */
  removeEmail(): Promise<void>;
}