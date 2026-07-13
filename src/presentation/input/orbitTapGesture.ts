/**
 * OrbitTapGesture — Máquina de estados pura que separa TAP de DRAG (MODO CUBO).
 *
 * Regla de la casa (diseño aprobado): un puntero que se mueve más de
 * `tapMaxDistancePx` O permanece abajo más de `tapMaxDurationMs` deja de ser
 * jugada — el pointerup se ignora como tap. El drag orbita desde CUALQUIER
 * punto de la pantalla (el llamador escucha en el contenedor completo, no
 * sobre el cubo).
 *
 * Sin dependencias de DOM ni de three: recibe coordenadas y timestamps, emite
 * eventos declarativos. Así el umbral 8px/200ms se testea sin navegador.
 */

export interface GestureConfig {
  tapMaxDistancePx: number;
  tapMaxDurationMs: number;
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  tapMaxDistancePx: 8,
  tapMaxDurationMs: 200,
};

export type GestureEvent =
  | { type: 'orbit'; dx: number; dy: number }
  | { type: 'tap'; x: number; y: number };

export class OrbitTapGesture {
  private readonly config: GestureConfig;
  private down = false;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private lastX = 0;
  private lastY = 0;
  private dragging = false;

  constructor(config: GestureConfig = DEFAULT_GESTURE_CONFIG) {
    this.config = config;
  }

  get isDown(): boolean {
    return this.down;
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  pointerDown(x: number, y: number, timeMs: number): void {
    this.down = true;
    this.dragging = false;
    this.startX = x;
    this.startY = y;
    this.lastX = x;
    this.lastY = y;
    this.startTime = timeMs;
  }

  /**
   * Devuelve un evento 'orbit' con el delta desde el último movimiento cuando
   * el gesto ya es drag (umbral de distancia superado). El primer orbit
   * incluye el desplazamiento acumulado desde el pointerdown, para no perder
   * los primeros píxeles del arrastre.
   */
  pointerMove(x: number, y: number): GestureEvent | null {
    if (!this.down) {
      return null;
    }
    if (!this.dragging) {
      const dist = Math.hypot(x - this.startX, y - this.startY);
      if (dist <= this.config.tapMaxDistancePx) {
        return null;
      }
      this.dragging = true;
      const event: GestureEvent = { type: 'orbit', dx: x - this.startX, dy: y - this.startY };
      this.lastX = x;
      this.lastY = y;
      return event;
    }
    const event: GestureEvent = { type: 'orbit', dx: x - this.lastX, dy: y - this.lastY };
    this.lastX = x;
    this.lastY = y;
    return event;
  }

  /**
   * Devuelve 'tap' SOLO si no hubo drag y el puntero estuvo abajo menos del
   * umbral de tiempo. Superado cualquiera de los dos umbrales, el up no es
   * jugada (retorna null).
   */
  pointerUp(x: number, y: number, timeMs: number): GestureEvent | null {
    if (!this.down) {
      return null;
    }
    this.down = false;
    const wasDragging = this.dragging;
    this.dragging = false;

    if (wasDragging) {
      return null;
    }
    if (timeMs - this.startTime > this.config.tapMaxDurationMs) {
      return null;
    }
    if (Math.hypot(x - this.startX, y - this.startY) > this.config.tapMaxDistancePx) {
      return null;
    }
    return { type: 'tap', x, y };
  }

  /** Cancela el gesto en curso (pointercancel / pérdida de captura). */
  cancel(): void {
    this.down = false;
    this.dragging = false;
  }
}
