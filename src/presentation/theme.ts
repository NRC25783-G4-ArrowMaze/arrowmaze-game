/**
 * theme — Constantes visuales de la capa de presentación (look de referencia).
 *
 * Tema CLARO: lienzo blanco con una grilla de puntos gris claro de fondo y las
 * flechas dibujadas encima conservando el color que viene del dato (regla B1).
 *
 * Centralizar aquí los colores/proporciones evita que cada componente invente
 * su propia paleta y mantiene un único punto de cambio para el look.
 */

/** Color de fondo del lienzo SVG. Tema claro → blanco. */
export const BOARD_BACKGROUND = '#ffffff';

/**
 * Color neutro de TODOS los puntos de la grilla de fondo (gris claro).
 * Ningún punto puede individualizar su color (regla B1: dots homogéneos).
 */
export const DOT_COLOR = '#d3d7e0';

/** Radio del punto de la grilla como fracción de cellSize. */
export const DOT_RADIUS_RATIO = 0.09;

/**
 * ARROW_SCALE — Escala global del glifo de la flecha respecto a la celda.
 *
 * Multiplica de forma uniforme TODOS los ratios del glifo (cabeza + cuerpo),
 * de modo que la flecha se encoge/agranda coherente (la punta y el cuerpo
 * mantienen su proporción). 1.0 = tamaño histórico; <1 = más pequeña.
 *
 * IMPORTANTE: el hit-area del input es la CELDA COMPLETA (screenToCell mapea
 * el toque a la celda más cercana) y NO depende de esta escala. Encoger el
 * glifo NO reduce la zona tocable — la usabilidad móvil se conserva.
 */
export const ARROW_SCALE = 0.55;

/**
 * Ratios base del glifo (fracción de cellSize a escala 1.0):
 *  - El cuerpo es un trazo; el spec B1 exige una fracción fija entre 30% y 50%
 *    a escala 1.0 (aquí 38%).
 *  - La cabeza es un triángulo definido por tres distancias desde su centro.
 * No se consumen directamente: se exponen ya escalados en ARROW_GLYPH.
 */
const BODY_STROKE_BASE = 0.38; // grosor del trazo del cuerpo
const HEAD_TIP_BASE = 0.5; // centro → apex
const HEAD_BACK_BASE = 0.32; // centro → punto medio de la base
const HEAD_HALF_BASE_BASE = 0.36; // mitad del ancho de la base

/**
 * ARROW_GLYPH — Ratios FINALES del glifo (ya multiplicados por ARROW_SCALE).
 *
 * Punto único de verdad del tamaño visual: los componentes consumen estos
 * valores tal cual (una multiplicación por cellSize, sin acumular factores).
 */
export const ARROW_GLYPH = {
  /** Grosor del trazo del cuerpo, como fracción de cellSize. */
  bodyStrokeRatio: BODY_STROKE_BASE * ARROW_SCALE,
  /** Cabeza: distancia centro → apex, como fracción de cellSize. */
  headTipRatio: HEAD_TIP_BASE * ARROW_SCALE,
  /** Cabeza: distancia centro → base, como fracción de cellSize. */
  headBackRatio: HEAD_BACK_BASE * ARROW_SCALE,
  /** Cabeza: mitad del ancho de la base, como fracción de cellSize. */
  headHalfBaseRatio: HEAD_HALF_BASE_BASE * ARROW_SCALE,
} as const;
