// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// se prueba como función pura. Este spec cubre la Rule de cambio EN CALIENTE
// (D3), que es render-dependiente y no se puede expresar como función pura.
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { useTranslation } from '../../src/presentation/i18n/I18nContext';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';
import { translate } from '../../src/presentation/i18n/i18n';
import type { ILanguagePreferenceProvider } from '../../src/application/ports/ILanguagePreferenceProvider';

/** Fake del puerto de preferencia: captura lo que se persiste (D2). */
class FakeLanguagePreference implements ILanguagePreferenceProvider {
  public readonly saved: string[] = [];
  async getLanguage(): Promise<string | null> {
    return null;
  }
  async setLanguage(lang: string): Promise<void> {
    this.saved.push(lang);
  }
}

/**
 * Simula un fragmento de UI con estado propio (como una partida en curso): un
 * contador que NO debe reiniciarse al cambiar el idioma, y un texto dinámico que
 * SÍ debe re-renderizarse en el nuevo idioma.
 */
const GameLikeConsumer = () => {
  const { t } = useTranslation();
  const [moves, setMoves] = useState(0);
  return (
    <div>
      <span data-testid="moves">{t('game.movesLeft', { count: moves })}</span>
      <button data-testid="play" onClick={() => setMoves((m) => m + 1)}>
        play
      </button>
    </div>
  );
};

describe('i18n — cambio de idioma en caliente desde Ajustes (D3)', () => {
  it('cambiar ES→EN re-renderiza los textos sin perder el estado de la partida y persiste la preferencia', () => {
    const pref = new FakeLanguagePreference();
    render(
      <I18nProvider preferenceProvider={pref} initialLang="es">
        <GameLikeConsumer />
        <SettingsOverlay visible onClose={() => undefined} />
      </I18nProvider>,
    );

    // Estado de partida: avanzamos a 3 movimientos antes de cambiar idioma.
    fireEvent.click(screen.getByTestId('play'));
    fireEvent.click(screen.getByTestId('play'));
    fireEvent.click(screen.getByTestId('play'));
    expect(screen.getByTestId('moves')).toHaveTextContent(translate('es', 'game.movesLeft', { count: 3 }));

    // Cambio en caliente al inglés desde el selector de Ajustes.
    fireEvent.click(screen.getByText(translate('es', 'settings.language.en')));

    // La UI re-renderiza en inglés de inmediato...
    expect(screen.getByTestId('moves')).toHaveTextContent(translate('en', 'game.movesLeft', { count: 3 }));
    expect(screen.getByText(translate('en', 'settings.back'))).toBeInTheDocument();

    // ...pero el estado (3 movimientos) NO se pierde, solo cambió el idioma.
    expect(screen.getByTestId('moves')).toHaveTextContent('3');

    // Y la preferencia se persiste (D2) para próximos arranques.
    expect(pref.saved).toEqual(['en']);
  });

  it('volver a ES re-renderiza de nuevo (el cambio es reversible)', () => {
    const pref = new FakeLanguagePreference();
    render(
      <I18nProvider preferenceProvider={pref} initialLang="en">
        <SettingsOverlay visible onClose={() => undefined} />
      </I18nProvider>,
    );

    expect(screen.getByText(translate('en', 'settings.back'))).toBeInTheDocument();
    fireEvent.click(screen.getByText(translate('en', 'settings.language.es')));
    expect(screen.getByText(translate('es', 'settings.back'))).toBeInTheDocument();
    expect(pref.saved).toEqual(['es']);
  });
});
