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
}