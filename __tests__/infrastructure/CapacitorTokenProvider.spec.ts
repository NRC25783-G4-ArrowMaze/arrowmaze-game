import { Preferences } from '@capacitor/preferences';
import { CapacitorTokenProvider } from '../../src/infrastructure/auth/CapacitorTokenProvider';

jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockGet = Preferences.get as jest.Mock;
const mockSet = Preferences.set as jest.Mock;
const mockRemove = Preferences.remove as jest.Mock;

const TOKEN_KEY = 'auth_session_token';
const EMAIL_KEY = 'auth_session_email';

describe('CapacitorTokenProvider — contrato de storage (token + email de sesión)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockRemove.mockReset();
  });

  describe('token', () => {
    it('setToken usa la clave auth_session_token', async () => {
      mockSet.mockResolvedValue(undefined);
      await new CapacitorTokenProvider().setToken('jwt-123');
      expect(mockSet).toHaveBeenCalledWith({ key: TOKEN_KEY, value: 'jwt-123' });
    });

    it('getToken lee esa clave; removeToken la borra', async () => {
      mockGet.mockResolvedValue({ value: 'jwt-123' });
      mockRemove.mockResolvedValue(undefined);
      const p = new CapacitorTokenProvider();
      expect(await p.getToken()).toBe('jwt-123');
      expect(mockGet).toHaveBeenCalledWith({ key: TOKEN_KEY });
      await p.removeToken();
      expect(mockRemove).toHaveBeenCalledWith({ key: TOKEN_KEY });
    });
  });

  describe('email de sesión (badge de usuario)', () => {
    it('setEmail usa la clave hermana auth_session_email', async () => {
      mockSet.mockResolvedValue(undefined);
      await new CapacitorTokenProvider().setEmail('juan@arrowmaze.com');
      expect(mockSet).toHaveBeenCalledWith({ key: EMAIL_KEY, value: 'juan@arrowmaze.com' });
    });

    it('getEmail lee esa clave y devuelve el valor', async () => {
      mockGet.mockResolvedValue({ value: 'juan@arrowmaze.com' });
      const email = await new CapacitorTokenProvider().getEmail();
      expect(mockGet).toHaveBeenCalledWith({ key: EMAIL_KEY });
      expect(email).toBe('juan@arrowmaze.com');
    });

    it('getEmail devuelve null si no hay email guardado (migración: logueado sin email)', async () => {
      mockGet.mockResolvedValue({ value: null });
      expect(await new CapacitorTokenProvider().getEmail()).toBeNull();
    });

    it('getEmail devuelve null (fail-safe) si el storage lanza', async () => {
      mockGet.mockRejectedValue(new Error('storage boom'));
      expect(await new CapacitorTokenProvider().getEmail()).toBeNull();
    });

    it('removeEmail borra la clave del email', async () => {
      mockRemove.mockResolvedValue(undefined);
      await new CapacitorTokenProvider().removeEmail();
      expect(mockRemove).toHaveBeenCalledWith({ key: EMAIL_KEY });
    });
  });
});
