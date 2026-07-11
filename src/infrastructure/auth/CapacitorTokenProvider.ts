import { Preferences } from '@capacitor/preferences';
import { type IAuthTokenProvider } from '../../application/ports/IAuthTokenProvider';

export class CapacitorTokenProvider implements IAuthTokenProvider {
  // Definimos la clave como una constante privada
  private readonly TOKEN_KEY = 'auth_session_token';
  // Clave hermana del token: el email de la sesión activa (badge de usuario).
  private readonly EMAIL_KEY = 'auth_session_email';

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

  /**
   * Lee el email de la sesión activa. Fail-safe: ante un error de storage
   * devuelve null (se asume sin identidad), igual que getToken.
   */
  async getEmail(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.EMAIL_KEY });
      return value;
    } catch (error) {
      console.error('[CapacitorTokenProvider] Error leyendo el email:', error);
      return null;
    }
  }

  /** Guarda el email tras un login exitoso. */
  async setEmail(email: string): Promise<void> {
    await Preferences.set({ key: this.EMAIL_KEY, value: email });
  }

  /** Elimina el email guardado (logout o revocación por 401). */
  async removeEmail(): Promise<void> {
    await Preferences.remove({ key: this.EMAIL_KEY });
  }
}