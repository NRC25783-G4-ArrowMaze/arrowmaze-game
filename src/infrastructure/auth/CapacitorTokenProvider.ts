import { Preferences } from '@capacitor/preferences';
import { type IAuthTokenProvider } from '../../application/ports/IAuthTokenProvider';

export class CapacitorTokenProvider implements IAuthTokenProvider {
  // Definimos la clave como una constante privada
  private readonly TOKEN_KEY = 'auth_session_token';

  /**
   * Cumple con el contrato de IAuthTokenProvider para leer el JWT.
   */
  async getToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.TOKEN_KEY });
      return value;
    } catch (error) {
      console.error('[CapacitorTokenProvider] Error leyendo el token:', error);
      return null;
    }
  }

  /**
   * Utilidad para guardar el JWT cuando el usuario inicie sesión con éxito.
   */
  async setToken(token: string): Promise<void> {
    await Preferences.set({
      key: this.TOKEN_KEY,
      value: token,
    });
  }

  /**
   * Utilidad para eliminar el JWT cuando el usuario cierre sesión 
   * o cuando recibamos un error 401.
   */
  async removeToken(): Promise<void> {
    await Preferences.remove({ key: this.TOKEN_KEY });
  }
}