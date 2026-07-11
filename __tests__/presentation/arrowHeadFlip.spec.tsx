import React from 'react';
import { render } from '@testing-library/react';
import { ArrowComponent } from '../../src/presentation/components/ArrowComponent';
import type { Point } from '../../src/presentation/rendering/boardLayout';

/**
 * Regresión: una flecha de 1 celda NO debe voltearse tras colisionar. En REPOSO
 * la orientación de la cabeza la dicta el dominio (exitDir), nunca el riel: tras
 * el glide-back el último tramo del riel apunta hacia atrás, y si la cabeza lo
 * siguiera en reposo quedaría mirando al lado contrario.
 *
 * jsdom no tiene requestAnimationFrame → cada rerender queda en REPOSO (snap).
 */

const CELL = 70;

// Sin requestAnimationFrame el glide hace snap inmediato al target → cada
// rerender queda en REPOSO verdadero (offset == target), que es justo lo que
// queremos asertar. (jsdom SÍ provee rAF, pero sin flush dejaría el offset a 0.)
let rafBackup: typeof requestAnimationFrame | undefined;
let cafBackup: typeof cancelAnimationFrame | undefined;
beforeAll(() => {
  rafBackup = global.requestAnimationFrame;
  cafBackup = global.cancelAnimationFrame;
  // @ts-expect-error: forzamos el entorno sin rAF para el snap.
  delete global.requestAnimationFrame;
  // @ts-expect-error: idem, quitamos cancelAnimationFrame para el snap.
  delete global.cancelAnimationFrame;
});
afterAll(() => {
  global.requestAnimationFrame = rafBackup!;
  global.cancelAnimationFrame = cafBackup!;
});

function headApex(container: HTMLElement): Point {
  const poly = container.querySelector('[data-testid="arrow-head"]');
  const points = poly?.getAttribute('points') ?? '';
  const [first] = points.trim().split(/\s+/);
  const [x, y] = first.split(',').map(Number);
  return { x, y };
}

function renderArrow(centers: Point[], exitDir: number, rerender?: ReturnType<typeof render>['rerender']) {
  const node = (
    <svg>
      <ArrowComponent color="#3355ff" centers={centers} exitDir={exitDir} cellSize={CELL} />
    </svg>
  );
  if (rerender) {
    rerender(node);
    return undefined;
  }
  return render(node);
}

describe('ArrowComponent — la cabeza en reposo la dicta el dominio (exitDir)', () => {
  it('flecha de 1 celda: tras avanzar y volver por colisión, la punta NO se voltea', () => {
    const exitDir = 1; // Este → apex debe quedar al ESTE del centro (x mayor).
    const origin: Point = { x: 35, y: 35 };
    const advanced: Point = { x: 105, y: 35 };

    const { container, rerender } = renderArrow([origin], exitDir)!;
    // Avanza una celda (Este).
    renderArrow([advanced], exitDir, rerender);
    // Glide-back de colisión: regresa al origen.
    renderArrow([origin], exitDir, rerender);

    // En reposo, en el origen: la punta apunta al Este (exitDir), no al Oeste.
    const apex = headApex(container);
    expect(apex.x).toBeGreaterThan(origin.x);
  });

  it('flecha de 1 celda hacia el Sur mantiene la orientación tras el rebote', () => {
    const exitDir = 2; // Sur → apex al SUR del centro (y mayor).
    const origin: Point = { x: 35, y: 35 };
    const advanced: Point = { x: 35, y: 105 };

    const { container, rerender } = renderArrow([origin], exitDir)!;
    renderArrow([advanced], exitDir, rerender);
    renderArrow([origin], exitDir, rerender);

    const apex = headApex(container);
    expect(apex.y).toBeGreaterThan(origin.y);
  });
});
