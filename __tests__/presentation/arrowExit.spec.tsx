import React from 'react';
import { render } from '@testing-library/react';
import { ArrowExit } from '../../src/presentation/components/ArrowExit';
import type { Point } from '../../src/presentation/rendering/boardLayout';

const CELL = 70;

function renderExit(centers: Point[], exitDir: number, onDone = () => {}) {
  return render(
    <svg>
      <ArrowExit color="#3355ff" centers={centers} exitDir={exitDir} cellSize={CELL} onDone={onDone} />
    </svg>,
  );
}

describe('ArrowExit — overlay de salida voladora', () => {
  describe('con rAF (no flusheado): la salida arranca visible', () => {
    it('pinta cuerpo y cabeza al inicio del vuelo, sin llamar onDone aún', () => {
      const onDone = jest.fn();
      const { container } = renderExit(
        [
          { x: 35, y: 35 },
          { x: 105, y: 35 },
          { x: 175, y: 35 },
        ],
        1,
        onDone,
      );
      expect(container.querySelector('[data-testid="arrow-exit-body"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="arrow-exit-head"]')).not.toBeNull();
      expect(onDone).not.toHaveBeenCalled();
    });
  });

  describe('sin rAF (snap): termina y llama onDone (cleanup)', () => {
    let raf: typeof requestAnimationFrame | undefined;
    let caf: typeof cancelAnimationFrame | undefined;
    beforeAll(() => {
      raf = global.requestAnimationFrame;
      caf = global.cancelAnimationFrame;
      // @ts-expect-error: forzamos snap sin rAF.
      delete global.requestAnimationFrame;
      // @ts-expect-error: idem.
      delete global.cancelAnimationFrame;
    });
    afterAll(() => {
      global.requestAnimationFrame = raf!;
      global.cancelAnimationFrame = caf!;
    });

    it('llama onDone al terminar el vuelo', () => {
      const onDone = jest.fn();
      renderExit([{ x: 35, y: 35 }, { x: 105, y: 35 }], 1, onDone);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('flecha de 1 celda sale sin lanzar y llama onDone', () => {
      const onDone = jest.fn();
      expect(() => renderExit([{ x: 35, y: 35 }], 2, onDone)).not.toThrow();
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('centros vacíos: no lanza y llama onDone', () => {
      const onDone = jest.fn();
      expect(() => renderExit([], 1, onDone)).not.toThrow();
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
