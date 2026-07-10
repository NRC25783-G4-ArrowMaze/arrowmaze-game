import React from 'react';
import { render } from '@testing-library/react';
import { BoardComponent } from '../../src/presentation/components/BoardComponent';
import type { BoardViewModel, ArrowView } from '../../src/presentation/viewModel';

// Fila de 5 celdas (col 0..4), para que una flecha salga por el Este.
const CELLS = [0, 1, 2, 3, 4].map((i) => ({ id: `c${i}`, col: i, row: 0 }));
const W = 500;
const H = 100;

function board(arrows: ArrowView[]): BoardViewModel {
  return { cells: CELLS, arrows };
}

const A_FULL: ArrowView = { id: 'a', color: '#f00', cellIds: ['c2', 'c3', 'c4'], exitDir: 1 };
// Salida: cae la celda LÍDER por el frente (c4→c5 fuera). curr[i]===prev[i+1].
const A_EXIT: ArrowView = { id: 'a', color: '#f00', cellIds: ['c3', 'c4'], exitDir: 1 };
// Shrink que NO es salida (cae la cola, no el frente): no debe volar.
const A_REARDROP: ArrowView = { id: 'a', color: '#f00', cellIds: ['c2', 'c3'], exitDir: 1 };

const count = (c: HTMLElement, id: string): number =>
  c.querySelectorAll(`[data-testid="${id}"]`).length;

describe('BoardComponent — salida voladora (overlay)', () => {
  describe('con rAF (no flusheado): el overlay queda visible al salir', () => {
    it('al detectar la salida: oculta la flecha viva y muestra el overlay', () => {
      const { container, rerender } = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      expect(count(container, 'arrow')).toBe(1);
      expect(count(container, 'arrow-exit')).toBe(0);

      rerender(<BoardComponent board={board([A_EXIT])} width={W} height={H} />);
      expect(count(container, 'arrow-exit')).toBe(1); // overlay volando
      expect(count(container, 'arrow')).toBe(0); // flecha viva oculta
    });

    it('flecha de 1 celda que desaparece también dispara el overlay', () => {
      const single: ArrowView = { id: 's', color: '#0a0', cellIds: ['c4'], exitDir: 1 };
      const { container, rerender } = render(<BoardComponent board={board([single])} width={W} height={H} />);
      expect(count(container, 'arrow-exit')).toBe(0);
      rerender(<BoardComponent board={board([])} width={W} height={H} />);
      expect(count(container, 'arrow-exit')).toBe(1);
    });

    it('un shrink que NO es salida (cae la cola) no crea overlay', () => {
      const { container, rerender } = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      rerender(<BoardComponent board={board([A_REARDROP])} width={W} height={H} />);
      expect(count(container, 'arrow-exit')).toBe(0);
      expect(count(container, 'arrow')).toBe(1); // sigue viva (la maneja ArrowComponent)
    });

    // Repro follow-up #1 (PR #42): un restart/clear elimina flechas a media pista
    // en un solo tick, sin shrink. NO deben dispararse salidas voladoras fantasma.
    it('restart/clear de una flecha MULTICELDA no dispara overlay fantasma', () => {
      const { container, rerender } = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      expect(count(container, 'arrow')).toBe(1);
      rerender(<BoardComponent board={board([])} width={W} height={H} />); // clear directo, sin shrink
      expect(count(container, 'arrow-exit')).toBe(0);
    });

    it('restart/clear de una flecha de 1 celda a media pista (no en el borde) no dispara overlay', () => {
      // c2 (col 2) no está en el borde Este (maxCol 4); exitDir 1 no sale del tablero.
      const midSingle: ArrowView = { id: 'm', color: '#0a0', cellIds: ['c2'], exitDir: 1 };
      const { container, rerender } = render(<BoardComponent board={board([midSingle])} width={W} height={H} />);
      rerender(<BoardComponent board={board([])} width={W} height={H} />);
      expect(count(container, 'arrow-exit')).toBe(0);
    });

    // Follow-up #2 (PR #42): el clipPath usa un id único (useId), no uno global.
    it('el clipPath de salida tiene id único y el grupo lo referencia; 2 boards no colisionan', () => {
      const clipOf = (c: HTMLElement): { id: string; ref: string } => {
        const clip = c.querySelector('clipPath')!;
        const g = c.querySelector('[data-testid="pass-exits"]')!;
        return { id: clip.getAttribute('id')!, ref: g.getAttribute('clip-path')! };
      };
      const b1 = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      b1.rerender(<BoardComponent board={board([A_EXIT])} width={W} height={H} />);
      const b2 = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      b2.rerender(<BoardComponent board={board([A_EXIT])} width={W} height={H} />);

      const c1 = clipOf(b1.container);
      const c2 = clipOf(b2.container);
      expect(c1.ref).toBe(`url(#${c1.id})`); // el grupo referencia su propio clip
      expect(c2.ref).toBe(`url(#${c2.id})`);
      expect(c1.id).not.toBe(c2.id); // ids distintos entre instancias
    });

    it('en exit-mode se gatea el burst; sin salida el burst se muestra', () => {
      const vanishing = { color: '#f00', cellIds: ['c4'], nonce: 1 };
      // Control: sin salida, con vanishing → burst visible.
      const ctrl = render(<BoardComponent board={board([A_FULL])} width={W} height={H} vanishing={vanishing} />);
      expect(count(ctrl.container, 'arrow-burst')).toBe(1);
      ctrl.unmount();

      // Con salida activa + vanishing → burst gateado.
      const { container, rerender } = render(<BoardComponent board={board([A_FULL])} width={W} height={H} />);
      rerender(<BoardComponent board={board([A_EXIT])} width={W} height={H} vanishing={vanishing} />);
      expect(count(container, 'arrow-exit')).toBe(1);
      expect(count(container, 'arrow-burst')).toBe(0);
    });
  });

  describe('sin rAF (snap): cleanup garantizado, sin overlays huérfanos', () => {
    let raf: typeof requestAnimationFrame | undefined;
    let caf: typeof cancelAnimationFrame | undefined;
    beforeAll(() => {
      raf = global.requestAnimationFrame;
      caf = global.cancelAnimationFrame;
      // @ts-expect-error: snap sin rAF.
      delete global.requestAnimationFrame;
      // @ts-expect-error: idem.
      delete global.cancelAnimationFrame;
    });
    afterAll(() => {
      global.requestAnimationFrame = raf!;
      global.cancelAnimationFrame = caf!;
    });

    it('tras N salidas seguidas no quedan overlays en el DOM', () => {
      const { container, rerender } = render(<BoardComponent board={board([])} width={W} height={H} />);
      for (let n = 0; n < 4; n++) {
        const id = `a${n}`;
        const full: ArrowView = { id, color: '#00f', cellIds: ['c2', 'c3', 'c4'], exitDir: 1 };
        const exit: ArrowView = { id, color: '#00f', cellIds: ['c3', 'c4'], exitDir: 1 };
        rerender(<BoardComponent board={board([full])} width={W} height={H} />);
        rerender(<BoardComponent board={board([exit])} width={W} height={H} />);
        rerender(<BoardComponent board={board([])} width={W} height={H} />);
      }
      expect(count(container, 'arrow-exit')).toBe(0);
    });
  });
});
