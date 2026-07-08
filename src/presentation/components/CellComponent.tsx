import React from 'react';
import type { Point } from '../rendering/boardLayout';
import { DOT_COLOR } from '../theme';

/**
 * CellComponent — Pasada 1 del renderizado: un único punto de la grilla de fondo.
 *
 * Look de referencia: el fondo es una grilla de puntos gris claro homogéneos.
 * Componente "tonto": no calcula posición ni tamaño; recibe el centro y el radio
 * ya resueltos por la capa de layout, y pinta un círculo relleno con el color
 * neutro común (regla B1: ningún punto individualiza su color).
 */
export interface CellComponentProps {
  /** Centro del punto en coordenadas de pantalla (px). */
  center: Point;
  /** Radio del punto en píxeles (fracción del cellSize, calculada por el padre). */
  radius: number;
}

export const CellComponent: React.FC<CellComponentProps> = ({ center, radius }) => {
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={radius}
      fill={DOT_COLOR}
      data-testid="cell-dot"
    />
  );
};
