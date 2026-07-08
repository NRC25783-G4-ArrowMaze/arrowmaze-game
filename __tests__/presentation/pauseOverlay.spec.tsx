import type { ReactElement } from 'react';
import { PauseOverlay } from '../../src/presentation/components/PauseOverlay';

// Sin @testing-library: se invoca el componente como función pura y se
// inspecciona el elemento React devuelto (mismo patrón del repo: testear
// lógica/props, no snapshots de DOM).
const noop = (): void => undefined;

describe('PauseOverlay — visibilidad', () => {
  it('visible=false: no renderiza (retorna null)', () => {
    const element = PauseOverlay({
      visible: false,
      onResume: noop,
      onRestart: noop,
      onOpenSettings: noop,
      onExit: noop,
    });
    expect(element).toBeNull();
  });

  it('visible=true: renderiza el overlay de pausa', () => {
    const element = PauseOverlay({
      visible: true,
      onResume: noop,
      onRestart: noop,
      onOpenSettings: noop,
      onExit: noop,
    });
    expect(element).not.toBeNull();
    expect(element?.props['data-testid']).toBe('pause-overlay');
  });
});

describe('PauseOverlay — callbacks expuestos sin envolver', () => {
  it('cada botón invoca exactamente el callback recibido por identidad', () => {
    const onResume = jest.fn();
    const onRestart = jest.fn();
    const onOpenSettings = jest.fn();
    const onExit = jest.fn();

    const element = PauseOverlay({
      visible: true,
      onResume,
      onRestart,
      onOpenSettings,
      onExit,
    });

    const children = element?.props.children as ReactElement[];
    const buttons = children.filter((child) => child?.type === 'button');
    const clickHandlers = buttons.map((button) => button.props.onClick);

    expect(clickHandlers).toContain(onResume);
    expect(clickHandlers).toContain(onRestart);
    expect(clickHandlers).toContain(onOpenSettings);
    expect(clickHandlers).toContain(onExit);
  });
});
