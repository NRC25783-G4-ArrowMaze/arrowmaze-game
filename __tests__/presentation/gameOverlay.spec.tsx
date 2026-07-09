// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (catálogos, resolución, fallback, interpolación) se prueba como función pura.
// El patrón puro del repo (invocar el componente como función) es incompatible
// con hooks → render() solo donde hay contexto.
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { GameOverlay } from '../../src/presentation/components/GameOverlay';
import { translate } from '../../src/presentation/i18n/i18n';
import { formatDuration } from '../../src/presentation/game/levelTimer';

const noop = (): void => undefined;
const renderEs = (ui: React.ReactElement) =>
  render(<I18nProvider initialLang="es">{ui}</I18nProvider>);

// Textos esperados desde el catálogo (no hardcodeados), idioma por defecto es.
const nextLevelText = translate('es', 'overlay.victory.nextLevel');
const backToMapText = translate('es', 'overlay.backToMap');

describe('GameOverlay — visibilidad', () => {
  it('IN_PROGRESS: no renderiza', () => {
    renderEs(<GameOverlay status="IN_PROGRESS" score={null} />);
    expect(screen.queryByTestId('game-overlay')).toBeNull();
  });

  it('WON: renderiza el overlay', () => {
    renderEs(<GameOverlay status="WON" score={1000} />);
    expect(screen.getByTestId('game-overlay')).toBeInTheDocument();
  });
});

describe('GameOverlay — acciones de continuación', () => {
  it('WON con onNextLevel y onBackToMap: ofrece ambas acciones y cada botón invoca su callback', () => {
    const onNextLevel = jest.fn();
    const onBackToMap = jest.fn();
    renderEs(<GameOverlay status="WON" score={1000} onNextLevel={onNextLevel} onBackToMap={onBackToMap} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([nextLevelText, backToMapText]);

    fireEvent.click(screen.getByText(nextLevelText));
    fireEvent.click(screen.getByText(backToMapText));
    expect(onNextLevel).toHaveBeenCalledTimes(1);
    expect(onBackToMap).toHaveBeenCalledTimes(1);
  });

  it('WON sin onNextLevel (último nivel): solo ofrece volver al mapa', () => {
    renderEs(<GameOverlay status="WON" score={1000} onBackToMap={noop} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([backToMapText]);
  });

  it('LOST: nunca ofrece siguiente nivel, solo volver al mapa', () => {
    renderEs(<GameOverlay status="LOST" score={null} onNextLevel={noop} onBackToMap={noop} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([backToMapText]);
  });

  it('sin callbacks (uso legado): no renderiza botones', () => {
    renderEs(<GameOverlay status="WON" score={500} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('GameOverlay — tiempo final del nivel (G3)', () => {
  it('al ganar muestra el tiempo (mm:ss) junto al score, vía catálogo', () => {
    renderEs(<GameOverlay status="WON" score={1000} timeSeconds={130} onBackToMap={noop} />);
    expect(screen.getByTestId('overlay-time')).toHaveTextContent(
      translate('es', 'overlay.time', { time: formatDuration(130) }),
    );
  });

  it('al perder también muestra el tiempo (el timer se detuvo)', () => {
    renderEs(<GameOverlay status="LOST" score={null} timeSeconds={240} onBackToMap={noop} />);
    expect(screen.getByTestId('overlay-time')).toHaveTextContent(
      translate('es', 'overlay.time', { time: formatDuration(240) }),
    );
  });

  it('sin timeSeconds no muestra bloque de tiempo (compatibilidad)', () => {
    renderEs(<GameOverlay status="WON" score={1000} onBackToMap={noop} />);
    expect(screen.queryByTestId('overlay-time')).toBeNull();
  });
});
