// Cambio de tema EN CALIENTE: render-dependiente (data-theme en el root, sin
// remount) — mismo criterio que i18nHotChange.spec para el idioma.
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../src/presentation/theming/ThemeProvider';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';
import { ThemeToggleButton } from '../../src/presentation/components/ThemeToggleButton';
import { translate } from '../../src/presentation/i18n/i18n';

/** Fragmento con estado propio (como una partida): NO debe remontarse al cambiar el tema. */
const GameLikeConsumer = () => {
  const [moves, setMoves] = useState(0);
  return (
    <div>
      <span data-testid="moves">{moves}</span>
      <button data-testid="play" onClick={() => setMoves((m) => m + 1)}>
        play
      </button>
    </div>
  );
};

const renderAll = () =>
  render(
    <ThemeProvider initialTheme="light">
      <I18nProvider initialLang="es">
        <ThemeToggleButton />
        <GameLikeConsumer />
        <SettingsOverlay visible onClose={() => undefined} />
      </I18nProvider>
    </ThemeProvider>,
  );

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('tema — cambio en caliente y fuente de verdad única (header ↔ Ajustes)', () => {
  it('cambiar a oscuro desde Ajustes actualiza data-theme sin perder el estado de la partida', () => {
    renderAll();
    fireEvent.click(screen.getByTestId('play'));
    fireEvent.click(screen.getByTestId('play'));
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(screen.getByText(translate('es', 'settings.theme.dark')));

    // El root cambió en caliente...
    expect(document.documentElement.dataset.theme).toBe('dark');
    // ...y el estado (2 movimientos) NO se perdió: no hubo remount.
    expect(screen.getByTestId('moves')).toHaveTextContent('2');
  });

  it('el toggle del header refleja el estado: ☀️ en claro, 🌙 en oscuro, con aria-label dinámico', () => {
    renderAll();
    const toggle = screen.getByTestId('theme-toggle');
    expect(toggle).toHaveTextContent('☀️');
    expect(toggle).toHaveAttribute('aria-label', translate('es', 'theme.toggle.toDark'));
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveTextContent('🌙');
    expect(toggle).toHaveAttribute('aria-label', translate('es', 'theme.toggle.toLight'));
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('header y Ajustes comparten fuente de verdad: cambiar en uno se refleja en el otro al instante', () => {
    renderAll();
    const toggle = screen.getByTestId('theme-toggle');
    const darkOption = screen.getByText(translate('es', 'settings.theme.dark'));
    const lightOption = screen.getByText(translate('es', 'settings.theme.light'));

    // Tap en el header → el selector de Ajustes marca "Oscuro" activo.
    fireEvent.click(toggle);
    expect(darkOption).toHaveAttribute('aria-pressed', 'true');
    expect(lightOption).toHaveAttribute('aria-pressed', 'false');

    // Volver a claro desde Ajustes → el icono del header vuelve a ☀️.
    fireEvent.click(lightOption);
    expect(toggle).toHaveTextContent('☀️');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
