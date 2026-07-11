// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (catálogos, resolución, fallback, interpolación) se prueba como función pura.
// El patrón puro del repo (invocar el componente como función) es incompatible
// con hooks → render() solo donde hay contexto.
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { AudioProvider } from '../../src/presentation/audio/AudioProvider';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';
import { translate } from '../../src/presentation/i18n/i18n';
import type { IAudioPreferences, AudioPreferences } from '../../src/application/ports/IAudioPreferences';

const noop = (): void => undefined;
const renderEs = (ui: React.ReactElement) =>
  render(<I18nProvider initialLang="es">{ui}</I18nProvider>);

/** Fake del puerto de preferencias de audio que captura lo persistido. */
class FakeAudioPrefs implements IAudioPreferences {
  public readonly saved: AudioPreferences[] = [];
  async getAudioPreferences(): Promise<AudioPreferences | null> {
    return null;
  }
  async setAudioPreferences(prefs: AudioPreferences): Promise<void> {
    this.saved.push(prefs);
  }
}

describe('SettingsOverlay — visibilidad', () => {
  it('visible=false: no renderiza', () => {
    renderEs(<SettingsOverlay visible={false} onClose={noop} />);
    expect(screen.queryByTestId('settings-overlay')).toBeNull();
  });

  it('visible=true: renderiza el overlay de ajustes', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument();
  });
});

describe('SettingsOverlay — secciones', () => {
  it('muestra las secciones de Idioma y Audio', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    expect(screen.getByText(translate('es', 'settings.language.title'))).toBeInTheDocument();
    expect(screen.getByText(translate('es', 'settings.audio.title'))).toBeInTheDocument();
  });

  it('el selector de idioma ofrece Español e English', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    const selector = screen.getByTestId('language-selector');
    expect(selector).toHaveTextContent(translate('es', 'settings.language.es'));
    expect(selector).toHaveTextContent(translate('es', 'settings.language.en'));
  });

  it('el botón "Volver" invoca exactamente onClose', () => {
    const onClose = jest.fn();
    renderEs(<SettingsOverlay visible onClose={onClose} />);
    fireEvent.click(screen.getByText(translate('es', 'settings.back')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsOverlay — controles de audio (G1)', () => {
  it('renderiza mute, sliders de SFX/música y créditos', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    const audio = screen.getByTestId('audio-settings');
    expect(audio).toHaveTextContent(translate('es', 'settings.audio.mute'));
    expect(screen.getByLabelText(translate('es', 'settings.audio.sfxVolume'))).toBeInTheDocument();
    expect(screen.getByLabelText(translate('es', 'settings.audio.musicVolume'))).toBeInTheDocument();
    expect(screen.getByTestId('audio-credits')).toHaveTextContent(translate('es', 'settings.audio.credits'));
  });

  it('los créditos muestran la atribución de XtremeFreddy (autor de easy/medium)', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    expect(screen.getByTestId('audio-credits')).toHaveTextContent('XtremeFreddy');
  });

  it('activar el mute persiste la preferencia vía el puerto de audio', () => {
    const fake = new FakeAudioPrefs();
    render(
      <I18nProvider initialLang="es">
        <AudioProvider preferenceProvider={fake} initialUnlocked>
          <SettingsOverlay visible onClose={noop} />
        </AudioProvider>
      </I18nProvider>,
    );
    const mute = screen.getByLabelText(translate('es', 'settings.audio.mute'));
    fireEvent.click(mute);
    expect(fake.saved.at(-1)?.muted).toBe(true);
  });
});
