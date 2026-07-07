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
 * Grosor del trazo del cuerpo de la flecha como fracción de cellSize.
 * El spec B1 exige una fracción fija entre 30% y 50%; fijamos 38%.
 */
export const BODY_STROKE_RATIO = 0.38;
