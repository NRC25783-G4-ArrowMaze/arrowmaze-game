import type { Vec3 } from './cubeTopology';
import { GLIDE_SPEED, exitOpacity } from '../../rendering/glideConfig';

/**
 * cubeRail — El riel 3D del MODO CUBO: puerto del modelo de railGlide.ts
 * (riel persistente + UN offset perseguido por rAF) a la superficie del cubo.
 *
 * Diferencia deliberada con el 2D: se parametriza por NODOS (celdas) en vez de
 * longitud de arco métrica. En la rejilla plana ambas coinciden (tramos de 1
 * celda); en el cubo los tramos que cruzan arista miden √½ (los centros se
 * acercan al doblar), así que parametrizar por arco desalinearía la forma en
 * reposo de los centros reales. En espacio de nodos:
 *   - la forma en reposo calza EXACTA con los centros de celda;
 *   - la velocidad es constante en celdas/segundo (paridad con GLIDE_SPEED y
 *     el ritmo del dominio, como el 2D);
 *   - retarget = apéndice de un nodo por delante + target+1: muestrear el
 *     mismo offset no cambia la forma dibujada (continuidad C0);
 *   - esquinas Y ARISTAS dobladas: los nodos interiores de la ventana entran
 *     al cuerpo, así la polilínea dobla sin cortar (mismo truco del 2D).
 *
 * Cero dominio: esto consume centros 3D ya proyectados (cubeRenderModel).
 */

const EPS = 1e-6;

function dist3(a: Vec3, b: Vec3): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function same3(a: Vec3 | undefined, b: Vec3 | undefined): boolean {
  if (a === undefined || b === undefined) {
    return false;
  }
  return dist3(a, b) <= EPS;
}

function lerp3(a: Vec3, b: Vec3, f: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
  };
}

/** Punto del riel en la posición de nodo u (continua), clampeada. */
export function pointAtNode(rail: readonly Vec3[], u: number): Vec3 {
  if (rail.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  const clamped = Math.max(0, Math.min(u, rail.length - 1));
  const i = Math.min(Math.floor(clamped), rail.length - 2);
  if (i < 0) {
    return { ...rail[0] };
  }
  return lerp3(rail[i], rail[i + 1], clamped - i);
}

/**
 * Dirección unitaria del tramo bajo la posición de nodo u. Convención de
 * frontera (como el 2D): en un nodo exacto se devuelve el tramo SALIENTE —
 * la punta gira en el instante justo del doblez de esquina o arista.
 */
export function dirAtNode(rail: readonly Vec3[], u: number): Vec3 {
  if (rail.length < 2) {
    return { x: 0, y: 0, z: 0 };
  }
  const clamped = Math.max(0, Math.min(u, rail.length - 1));
  const seg = Math.min(Math.floor(clamped), rail.length - 2);
  const a = rail[seg];
  const b = rail[seg + 1];
  const len = dist3(a, b) || 1;
  return { x: (b.x - a.x) / len, y: (b.y - a.y) / len, z: (b.z - a.z) / len };
}

export interface RailSample3 {
  /** Polilínea del cuerpo: vértice trasero, nodos-esquina interiores, punta. */
  body: Vec3[];
  /** Los `count` vértices lógicos (punta = último). */
  vertices: Vec3[];
  /** Dirección unitaria bajo la punta. */
  tipDir: Vec3;
}

/**
 * Ventana deslizante de `count` vértices sobre el riel: el vértice i vive en
 * la posición de nodo `offset + i`. El cuerpo incluye los nodos interiores
 * (esquinas y aristas) para doblar sin cortar.
 */
export function sampleShapeOnRailNodes(
  rail: readonly Vec3[],
  offset: number,
  count: number,
): RailSample3 {
  const vertices: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    vertices.push(pointAtNode(rail, offset + i));
  }

  const rear = offset;
  const lead = offset + count - 1;
  const body: Vec3[] = [vertices[0]];
  for (let k = Math.ceil(rear + EPS); k < lead - EPS; k++) {
    const node = rail[Math.max(0, Math.min(k, rail.length - 1))];
    if (!same3(body[body.length - 1], node)) {
      body.push(node);
    }
  }
  const tipVertex = vertices[count - 1];
  if (count > 1 && !same3(body[body.length - 1], tipVertex)) {
    body.push(tipVertex);
  }

  return { body, vertices, tipDir: dirAtNode(rail, lead) };
}

/**
 * CubeRailAnimator — estado de animación de UNA flecha sobre su riel.
 *
 * El GameController sigue mandando (snap tick a tick del dominio); esto solo
 * interpola ENTRE proyecciones. Regla de oro: si la nueva proyección no es
 * "la vieja avanzada exactamente un paso", SNAP SILENCIOSO al estado real —
 * la animación jamás tumba ni desmiente el juego.
 */
export class CubeRailAnimator {
  private rail: Vec3[];
  private offset: number;
  private target: number;
  private count: number;

  constructor(centers: readonly Vec3[]) {
    this.rail = [...centers];
    this.offset = 0;
    this.target = 0;
    this.count = centers.length;
  }

  /**
   * Reproyección del dominio. Retarget suave en tres patrones:
   *  - IDENTIDAD (restore del modo return): no-op.
   *  - AVANCE de un paso: apéndice por delante + target+1.
   *  - RETROCESO de un paso (glide de regreso): target−1 — el offset desanda
   *    EL MISMO riel, plegando aristas en reversa sin corte.
   * Cualquier otra proyección: snap silencioso al estado real.
   */
  retarget(centers: readonly Vec3[]): boolean {
    const winStart = this.target;
    if (
      centers.length === this.count &&
      this.count >= 1 &&
      Number.isInteger(winStart)
    ) {
      // Identidad: la proyección coincide con la ventana objetivo actual.
      let identical = true;
      for (let i = 0; i < this.count; i++) {
        if (!same3(centers[i], this.rail[winStart + i])) {
          identical = false;
          break;
        }
      }
      if (identical) {
        return true;
      }

      // Avance +1.
      let shifted = true;
      for (let i = 0; i < this.count - 1; i++) {
        if (!same3(centers[i], this.rail[winStart + 1 + i])) {
          shifted = false;
          break;
        }
      }
      if (shifted) {
        const lead = centers[this.count - 1];
        if (this.rail.length === winStart + this.count) {
          this.rail.push(lead);
          this.target = winStart + 1;
          return true;
        }
        if (same3(this.rail[winStart + this.count], lead)) {
          this.target = winStart + 1;
          return true;
        }
      }

      // Retroceso −1 (los nodos traseros del riel nunca se truncan).
      if (winStart >= 1) {
        let stepBack = true;
        for (let i = 0; i < this.count; i++) {
          if (!same3(centers[i], this.rail[winStart - 1 + i])) {
            stepBack = false;
            break;
          }
        }
        if (stepBack) {
          this.target = winStart - 1;
          return true;
        }
      }
    }
    // Snap silencioso: adopta la proyección real tal cual.
    this.rail = [...centers];
    this.offset = 0;
    this.target = 0;
    this.count = centers.length;
    return false;
  }

  /** Persigue el target a velocidad constante (celdas/s del 2D), en ambos sentidos. */
  tick(dtSeconds: number): void {
    if (this.offset < this.target) {
      this.offset = Math.min(this.target, this.offset + GLIDE_SPEED * dtSeconds);
    } else if (this.offset > this.target) {
      this.offset = Math.max(this.target, this.offset - GLIDE_SPEED * dtSeconds);
    }
  }

  get settled(): boolean {
    return this.offset === this.target;
  }

  sample(): RailSample3 {
    return sampleShapeOnRailNodes(this.rail, this.offset, this.count);
  }

  /** Vértices actuales (para arrancar el devorado desde la forma visible). */
  currentVertices(): Vec3[] {
    return this.sample().vertices;
  }
}

// ─────────────────────────────────────────────────────────────────
// RECOIL — el rebote del bloqueo (espejo del recoil del SVG 2D)
// ─────────────────────────────────────────────────────────────────

/** Duración del empujón de rebote al chocar (ms). */
export const RECOIL_MS = 200;

/** Amplitud del empujón, en celdas, a lo largo del tipDir. */
const RECOIL_AMPLITUDE = 0.16;

/**
 * Desplazamiento del glifo durante el rebote: pulso sinusoidal que sale y
 * regresa (0 en los extremos, máximo a mitad del pulso).
 */
export function recoilOffset(progress: number): number {
  if (progress <= 0 || progress >= 1) {
    return 0;
  }
  return RECOIL_AMPLITUDE * Math.sin(Math.PI * progress);
}

// ─────────────────────────────────────────────────────────────────
// DEVORADO — el fly-off reorientado hacia el centro del cubo
// ─────────────────────────────────────────────────────────────────

/**
 * Riel del devorado: la forma visible seguida de nodos virtuales que marchan
 * desde la punta hacia el objetivo (el centro del cubo), espaciados ~1 celda
 * como los tramos reales — así el estiramiento en espacio de nodos también es
 * estiramiento métrico (el 2D hace lo mismo con cellSize en extendRailForExit).
 */
export function buildDevourRail(vertices: readonly Vec3[], target: Vec3): Vec3[] {
  if (vertices.length === 0) {
    return [];
  }
  const rail = vertices.map((p) => ({ ...p }));
  const lead = vertices[vertices.length - 1];
  const nodes = Math.max(1, Math.round(dist3(lead, target)));
  for (let k = 1; k <= nodes; k++) {
    rail.push(lerp3(lead, target, k / nodes));
  }
  return rail;
}

export interface DevourSample {
  body: Vec3[];
  vertices: Vec3[];
  tipDir: Vec3;
  /** Opacidad decreciente (curva de fade del 2D reutilizada). */
  opacity: number;
}

/** Exponente del rezago de la cola: >1 = la cola tarda más → estiramiento. */
const DEVOUR_REAR_LAG = 1.7;

/**
 * Forma del devorado para t ∈ [0,1]: la punta viaja hacia el final del riel
 * (el centro del cubo) a ritmo lineal y la cola la sigue con rezago — la
 * flecha se ESTIRA hacia adentro y colapsa en el centro mientras se funde.
 * En t=0 la forma es exactamente la visible; en t=1 todo está en el objetivo
 * con opacidad 0.
 */
export function sampleDevourShape(
  rail: readonly Vec3[],
  t: number,
  count: number,
): DevourSample {
  const clamped = Math.max(0, Math.min(t, 1));
  const last = rail.length - 1;
  const leadPos = (count - 1) + (last - (count - 1)) * clamped;
  const rearPos = last * Math.pow(clamped, DEVOUR_REAR_LAG);

  const vertices: Vec3[] = [];
  const n = Math.max(1, count);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? leadPos : rearPos + ((leadPos - rearPos) * i) / (n - 1);
    vertices.push(pointAtNode(rail, u));
  }

  const body: Vec3[] = [vertices[0]];
  for (let k = Math.ceil(rearPos + EPS); k < leadPos - EPS; k++) {
    const node = rail[Math.max(0, Math.min(k, last))];
    if (!same3(body[body.length - 1], node)) {
      body.push(node);
    }
  }
  const tip = vertices[n - 1];
  if (n > 1 && !same3(body[body.length - 1], tip)) {
    body.push(tip);
  }

  return {
    body,
    vertices,
    tipDir: dirAtNode(rail, leadPos),
    opacity: exitOpacity(clamped),
  };
}
