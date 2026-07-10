import { resolveInitialTheme, SUPPORTED_THEMES } from '../../src/presentation/theming/themeMode';

describe('tema — resolución inicial (guardada > prefers-color-scheme > claro)', () => {
  it('la preferencia guardada prevalece sobre el sistema', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('sin preferencia guardada decide el sistema', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('una preferencia corrupta se ignora y decide el sistema', () => {
    expect(resolveInitialTheme('sepia', true)).toBe('dark');
    expect(resolveInitialTheme('', false)).toBe('light');
  });

  it('v1 expone exactamente 2 temas, sin opción "sistema" (decisión consciente)', () => {
    expect(SUPPORTED_THEMES).toEqual(['light', 'dark']);
  });
});
