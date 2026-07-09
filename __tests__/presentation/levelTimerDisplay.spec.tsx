// Criterio de tests i18n (G2/G3): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (LevelTimer, formatDuration) se prueba como función pura.
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { LevelTimerDisplay } from '../../src/presentation/components/LevelTimerDisplay';
import { translate } from '../../src/presentation/i18n/i18n';

const renderEs = (ui: React.ReactElement) =>
  render(<I18nProvider initialLang="es">{ui}</I18nProvider>);

describe('LevelTimerDisplay', () => {
  it('muestra el tiempo en mm:ss', () => {
    renderEs(<LevelTimerDisplay seconds={754} />);
    expect(screen.getByTestId('level-timer')).toHaveTextContent('12:34');
  });

  it('muestra la etiqueta y el aria-label desde el catálogo (no hardcodeados)', () => {
    renderEs(<LevelTimerDisplay seconds={65} />);
    expect(screen.getByText(translate('es', 'game.time'))).toBeInTheDocument();
    expect(
      screen.getByLabelText(translate('es', 'game.timeElapsed', { time: '01:05' })),
    ).toBeInTheDocument();
  });
});
