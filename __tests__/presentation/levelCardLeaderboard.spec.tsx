import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { translate } from '../../src/presentation/i18n/i18n';
import { LevelNodeCard } from '../../src/presentation/game/LevelNodeCard';
import type { DerivedNode } from '../../src/domain/services/LevelSelectionProjection';

const T = (key: string): string => translate('es', key);
const noop = (): void => undefined;

function makeNode(over: Partial<DerivedNode> = {}): DerivedNode {
  return {
    levelId: 'level-initial',
    state: 'disponible',
    isFocal: false,
    ...over,
  } as DerivedNode;
}

function renderCard(node: DerivedNode, handlers: Partial<{ onSelectLevel: () => void; onOpenLeaderboard: () => void }> = {}) {
  return render(
    <I18nProvider initialLang="es">
      <LevelNodeCard
        node={node}
        metadata={{ name: 'Nivel Inicial', difficulty: 'easy' }}
        onSelectLevel={handlers.onSelectLevel ?? noop}
        onOpenLeaderboard={handlers.onOpenLeaderboard ?? noop}
      />
    </I18nProvider>,
  );
}

describe('LevelNodeCard — acceso al leaderboard (🏆)', () => {
  it('muestra el 🏆 con aria-label i18n en una card disponible', () => {
    renderCard(makeNode());
    expect(screen.getByLabelText(T('leaderboard.open'))).toBeInTheDocument();
  });

  it('muestra el 🏆 TAMBIÉN en cards bloqueadas (información social, no spoiler)', () => {
    renderCard(makeNode({ state: 'bloqueado' }));
    expect(screen.getByLabelText(T('leaderboard.open'))).toBeInTheDocument();
  });

  it('el 🏆 abre el leaderboard y NO dispara jugar (stopPropagation)', () => {
    const onSelectLevel = jest.fn();
    const onOpenLeaderboard = jest.fn();
    renderCard(makeNode(), { onSelectLevel, onOpenLeaderboard });

    fireEvent.click(screen.getByLabelText(T('leaderboard.open')));

    expect(onOpenLeaderboard).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).not.toHaveBeenCalled();
  });

  it('en una card bloqueada, el 🏆 abre el leaderboard sin el alert de bloqueado', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(noop);
    try {
      const onOpenLeaderboard = jest.fn();
      renderCard(makeNode({ state: 'bloqueado' }), { onOpenLeaderboard });

      fireEvent.click(screen.getByLabelText(T('leaderboard.open')));

      expect(onOpenLeaderboard).toHaveBeenCalledTimes(1);
      expect(alertSpy).not.toHaveBeenCalled();
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('el click en el resto de la card sigue jugando (no regresión)', () => {
    const onSelectLevel = jest.fn();
    renderCard(makeNode(), { onSelectLevel });

    fireEvent.click(screen.getByText('Nivel Inicial'));

    expect(onSelectLevel).toHaveBeenCalledTimes(1);
  });
});
