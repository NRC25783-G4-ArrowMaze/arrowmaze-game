export interface IAuthTokenProvider {
  /**
   * Obtiene el JWT actual de la sesión. Retorna null si el usuario no está logueado.
   */
  getToken(): Promise<string | null>;
}