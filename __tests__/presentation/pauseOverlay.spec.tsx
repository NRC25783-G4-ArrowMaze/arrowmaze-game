// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (catálogos, resolución, fallback, interpolación) se prueba como función pura.
// El patrón puro del repo (invocar el componente como función) es incompatible
// con hooks → render() solo donde hay contexto.
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { PauseOverlay } from '../../src/presentation/components/PauseOverlay';
import { translate } from '../../src/presentation/i18n/i18n';

const noop = (): void => undefined;
const renderEs = (ui: React.ReactElement) =>
  render(<I18nProvider initialLang="es">{ui}</I18nProvider>);

describe('PauseOverlay — visibilidad', () => {
  it('visible=false: no renderiza (retorna null)', () => {
    renderEs(
      <PauseOverlay visible={false} onResume={noop} onRestart={noop} onOpenSettings={noop} onExit={noop} />,
    );
    expect(screen.queryByTestId('pause-overlay')).toBeNull();
  });

  it('visible=true: renderiza el overlay de pausa', () => {
    renderEs(
      <PauseOverlay visible onResume={noop} onRestart={noop} onOpenSettings={noop} onExit={noop} />,
    );
    expect(screen.getByTestId('pause-overlay')).toBeInTheDocument();
  });
});

describe('PauseOverlay — callbacks expuestos sin envolver', () => {
  it('cada botón invoca exactamente el callback recibido', () => {
    const onResume = jest.fn();
    const onRestart = jest.fn();
    const onOpenSettings = jest.fn();
    const onExit = jest.fn();

    renderEs(
      <PauseOverlay
        visible
        onResume={onResume}
        onRestart={onRestart}
        onOpenSettings={onOpenSettings}
        onExit={onExit}
      />,
    );

    fireEvent.click(screen.getByText(translate('es', 'pause.resume')));
    fireEvent.click(screen.getByText(translate('es', 'pause.restart')));
    fireEvent.click(screen.getByText(translate('es', 'pause.settings')));
    fireEvent.click(screen.getByText(translate('es', 'pause.exit')));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
