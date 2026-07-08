// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (catálogos, resolución, fallback, interpolación) se prueba como función pura.
// El patrón puro del repo (invocar el componente como función) es incompatible
// con hooks → render() solo donde hay contexto.
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';
import { translate } from '../../src/presentation/i18n/i18n';

const noop = (): void => undefined;
const renderEs = (ui: React.ReactElement) =>
  render(<I18nProvider initialLang="es">{ui}</I18nProvider>);

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

  it('"Próximamente" solo queda en Audio (Idioma ya tiene selector)', () => {
    renderEs(<SettingsOverlay visible onClose={noop} />);
    expect(screen.getAllByText(translate('es', 'settings.comingSoon'))).toHaveLength(1);
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
