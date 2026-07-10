import React from 'react';
import { render } from '@testing-library/react';
import { ArrowComponent } from '../../src/presentation/components/ArrowComponent';
import type { Point } from '../../src/presentation/rendering/boardLayout';

/**
 * Regresión de CRASH: el riel persistente jamás puede lanzar una excepción
 * durante el render y tumbar el árbol de React. La animación es cosmética; ante
 * cualquier estado degenerado del riel debe caer a snap silencioso, nunca crash.
 *
 * jsdom NO provee requestAnimationFrame → se ejercita la vía "snap sin rAF".
 */

const CELL = 70;

function renderArrow(centers: Point[], exitDir: number) {
  return render(
    <svg>
      <ArrowComponent color="#3355ff" centers={centers} exitDir={exitDir} cellSize={CELL} />
    </svg>,
  );
}

describe('ArrowComponent — el riel nunca crashea el render', () => {
  it('flecha de UNA sola celda al montar (riel de un nodo) no lanza', () => {
    expect(() => renderArrow([{ x: 35, y: 35 }], 1)).not.toThrow();
  });

  it('secuencia real: montar → avanzar un paso → doblar, sin crash', () => {
    // Flecha de 2 celdas horizontal.
    const s1: Point[] = [
      { x: 35, y: 35 },
      { x: 105, y: 35 },
    ];
    const { rerender } = renderArrow(s1, 1);

    const rerenderArrow = (centers: Point[], exitDir: number): void => {
      rerender(
        <svg>
          <ArrowComponent color="#3355ff" centers={centers} exitDir={exitDir} cellSize={CELL} />
        </svg>,
      );
    };

    // Avance de un paso (este): la forma se corre una celda.
    const s2: Point[] = [
      { x: 105, y: 35 },
      { x: 175, y: 35 },
    ];
    expect(() => rerenderArrow(s2, 1)).not.toThrow();

    // Otro paso doblando al sur (giro de 90°).
    const s3: Point[] = [
      { x: 175, y: 35 },
      { x: 175, y: 105 },
    ];
    expect(() => rerenderArrow(s3, 2)).not.toThrow();
  });

  it('flecha larga (3 celdas) que dobla no lanza en el primer render ni en el paso', () => {
    const l1: Point[] = [
      { x: 35, y: 35 },
      { x: 105, y: 35 },
      { x: 175, y: 35 },
    ];
    const { rerender } = renderArrow(l1, 1);
    const l2: Point[] = [
      { x: 105, y: 35 },
      { x: 175, y: 35 },
      { x: 175, y: 105 },
    ];
    expect(() =>
      rerender(
        <svg>
          <ArrowComponent color="#3355ff" centers={l2} exitDir={2} cellSize={CELL} />
        </svg>,
      ),
    ).not.toThrow();
  });
});
