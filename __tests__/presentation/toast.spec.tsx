import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  Toast,
  TOAST_DURATION_MS,
  TOAST_EXIT_MS,
} from '../../src/presentation/components/Toast';

/**
 * Toast — aviso efímero (bienvenida/cierre de sesión). Contrato:
 * accesible (role=status + aria-live=polite), auto-dismiss por dial
 * (TOAST_DURATION_MS + salida animada), click lo cierra antes, y el
 * desmontaje limpia sus timers sin lanzar ni disparar onDone tardíos.
 */
describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('muestra el mensaje (contenido ya interpolado) con role=status y aria-live=polite', () => {
    render(<Toast message="¡Bienvenido, juan!" onDone={() => undefined} />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('¡Bienvenido, juan!');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('auto-dismiss: llama onDone UNA vez tras duración + salida', () => {
    const onDone = jest.fn();
    render(<Toast message="Sesión cerrada" onDone={onDone} />);

    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS - 1);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1 + TOAST_EXIT_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    // Ningún timer rezagado lo vuelve a disparar.
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS * 2);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('click: cierra ANTES del auto-dismiss (solo espera la salida animada)', () => {
    const onDone = jest.fn();
    render(<Toast message="¡Bienvenido, juan!" onDone={onDone} />);

    fireEvent.click(screen.getByRole('status'));
    act(() => {
      jest.advanceTimersByTime(TOAST_EXIT_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    // El auto-dismiss posterior no lo duplica.
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS + TOAST_EXIT_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('desmontar antes de tiempo: limpia timers, no lanza y no llama onDone después', () => {
    const onDone = jest.fn();
    const { unmount } = render(<Toast message="x" onDone={onDone} />);

    expect(() => unmount()).not.toThrow();
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS + TOAST_EXIT_MS + 100);
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('acepta una duración custom por prop (dial iterable)', () => {
    const onDone = jest.fn();
    render(<Toast message="x" onDone={onDone} durationMs={500} />);
    act(() => {
      jest.advanceTimersByTime(500 + TOAST_EXIT_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
