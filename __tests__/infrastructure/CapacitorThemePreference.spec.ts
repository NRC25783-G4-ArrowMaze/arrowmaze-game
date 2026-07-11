import { Preferences } from '@capacitor/preferences';
import { CapacitorThemePreference } from '../../src/infrastructure/theme/CapacitorThemePreference';

jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockGet = Preferences.get as jest.Mock;
const mockSet = Preferences.set as jest.Mock;

const THEME_KEY = 'ui_theme_preference';

describe('CapacitorThemePreference — contrato de storage de la preferencia de tema', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
  });

  it('setTheme persiste bajo la clave ui_theme_preference', async () => {
    mockSet.mockResolvedValue(undefined);
    await new CapacitorThemePreference().setTheme('dark');
    expect(mockSet).toHaveBeenCalledWith({ key: THEME_KEY, value: 'dark' });
  });

  it('getTheme lee esa clave y devuelve el valor guardado', async () => {
    mockGet.mockResolvedValue({ value: 'dark' });
    const theme = await new CapacitorThemePreference().getTheme();
    expect(mockGet).toHaveBeenCalledWith({ key: THEME_KEY });
    expect(theme).toBe('dark');
  });

  it('getTheme devuelve null si nunca se eligió tema', async () => {
    mockGet.mockResolvedValue({ value: null });
    expect(await new CapacitorThemePreference().getTheme()).toBeNull();
  });

  it('getTheme devuelve null (no revienta) si el storage falla', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGet.mockRejectedValue(new Error('storage roto'));
    expect(await new CapacitorThemePreference().getTheme()).toBeNull();
    consoleError.mockRestore();
  });
});
