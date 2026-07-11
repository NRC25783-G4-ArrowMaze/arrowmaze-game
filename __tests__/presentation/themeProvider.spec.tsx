// Criterio de tests del tema (espejo del criterio i18n de G2): el provider se
// prueba con render() de @testing-library y un fake del puerto; la resolución
// pura vive en themeResolution.spec.ts.
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '../../src/presentation/theming/ThemeProvider';
import { useTheme } from '../../src/presentation/theming/ThemeContext';
import type { IThemePreference } from '../../src/application/ports/IThemePreference';

/** Fake del puerto de preferencia: captura lo que se persiste. */
class FakeThemePreference implements IThemePreference {
  public readonly saved: string[] = [];
  constructor(private readonly stored: string | null = null) {}
  async getTheme(): Promise<string | null> {
    return this.stored;
  }
  async setTheme(theme: string): Promise<void> {
    this.saved.push(theme);
  }
}

const ThemeProbe = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <button data-testid="go-dark" onClick={() => setTheme('dark')}>
        dark
      </button>
    </div>
  );
};

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('ThemeProvider — persistencia y aplicación de data-theme en el root', () => {
  it('sin preferencia guardada ni matchMedia (jsdom) arranca en claro', () => {
    render(
      <ThemeProvider preferenceProvider={new FakeThemePreference(null)}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('la preferencia guardada (async) prevalece al montar', async () => {
    render(
      <ThemeProvider preferenceProvider={new FakeThemePreference('dark')}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('active-theme')).toHaveTextContent('dark'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('setTheme aplica data-theme en el root y persiste vía el puerto', async () => {
    const pref = new FakeThemePreference(null);
    render(
      <ThemeProvider preferenceProvider={pref}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('go-dark'));
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(pref.saved).toEqual(['dark']);
  });

  it('sin guardada, prefers-color-scheme: dark del sistema decide el arranque', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes('dark'), media: query }) as MediaQueryList) as typeof window.matchMedia;
    try {
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
