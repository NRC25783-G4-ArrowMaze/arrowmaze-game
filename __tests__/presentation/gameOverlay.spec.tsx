import type { ReactElement } from 'react';
import { GameOverlay } from '../../src/presentation/components/GameOverlay';

// Sin @testing-library: se invoca el componente como función pura y se
// inspecciona el elemento React devuelto (mismo patrón del repo: testear
// lógica/props, no snapshots de DOM).
const noop = (): void => undefined;

/** Aplana el árbol de children y devuelve los <button> con su onClick y texto. */
function findButtons(element: ReactElement | null): Array<{ text: string; onClick: () => void }> {
  if (element === null) return [];
  const buttons: Array<{ text: string; onClick: () => void }> = [];
  const visit = (node: unknown): void => {
    if (node === null || node === undefined || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const el = node as ReactElement<{ children?: unknown; onClick?: () => void }>;
    if (el.type === 'button' && el.props.onClick !== undefined) {
      buttons.push({ text: String(el.props.children), onClick: el.props.onClick });
    }
    visit(el.props?.children);
  };
  visit(element.props.children);
  return buttons;
}

describe('GameOverlay — visibilidad', () => {
  it('IN_PROGRESS: no renderiza (retorna null)', () => {
    expect(GameOverlay({ status: 'IN_PROGRESS', score: null })).toBeNull();
  });

  it('WON: renderiza el overlay', () => {
    const element = GameOverlay({ status: 'WON', score: 1000 });
    expect(element?.props['data-testid']).toBe('game-overlay');
  });
});

describe('GameOverlay — acciones de continuación', () => {
  it('WON con onNextLevel y onBackToMap: ofrece ambas acciones por identidad', () => {
    const onNextLevel = jest.fn();
    const onBackToMap = jest.fn();
    const buttons = findButtons(
      GameOverlay({ status: 'WON', score: 1000, onNextLevel, onBackToMap }),
    );

    expect(buttons.map((b) => b.text)).toEqual(['Siguiente nivel →', 'Volver al mapa']);
    expect(buttons[0].onClick).toBe(onNextLevel);
    expect(buttons[1].onClick).toBe(onBackToMap);
  });

  it('WON sin onNextLevel (último nivel): solo ofrece volver al mapa', () => {
    const buttons = findButtons(
      GameOverlay({ status: 'WON', score: 1000, onBackToMap: noop }),
    );
    expect(buttons.map((b) => b.text)).toEqual(['Volver al mapa']);
  });

  it('LOST: nunca ofrece siguiente nivel, solo volver al mapa', () => {
    const buttons = findButtons(
      GameOverlay({ status: 'LOST', score: null, onNextLevel: noop, onBackToMap: noop }),
    );
    expect(buttons.map((b) => b.text)).toEqual(['Volver al mapa']);
  });

  it('sin callbacks (uso legado): no renderiza botones', () => {
    expect(findButtons(GameOverlay({ status: 'WON', score: 500 }))).toEqual([]);
  });
});
