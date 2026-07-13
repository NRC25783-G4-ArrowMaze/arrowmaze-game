import type { Vec3 } from './cubeTopology';

/**
 * cubeCourtesy — Cámara de cortesía del MODO CUBO (diseño aprobado):
 * SOLO cuando el desenlace (flecha devorada) ocurre en una cara oculta, la
 * cámara gira suave para mostrarlo. Un bloqueo con regreso deja la cámara
 * quieta (la cortesía nunca se dispara en 'blocked'). Y jamás pelea con el
 * usuario: el llamador la cancela si hay drag o inercia viva.
 */

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * ¿La cara es visible desde la cámara? Producto punto entre la normal y la
 * dirección hacia la cámara; el umbral deja fuera las caras "de canto".
 */
export function isFaceVisible(
  normal: Vec3,
  faceCenter: Vec3,
  cameraPos: Vec3,
  threshold: number = 0.12,
): boolean {
  const to = {
    x: cameraPos.x - faceCenter.x,
    y: cameraPos.y - faceCenter.y,
    z: cameraPos.z - faceCenter.z,
  };
  const len = Math.hypot(to.x, to.y, to.z) || 1;
  return dot(normal, { x: to.x / len, y: to.y / len, z: to.z / len }) > threshold;
}

/**
 * Ángulos (yaw, pitch) que centran la cámara orbital frente a una cara.
 * - El yaw se devuelve en la vuelta más CERCANA al yaw actual (camino corto).
 * - El pitch se clampea al límite del orbit.
 * - Para arriba/abajo (normal ≈ ±y) cualquier yaw sirve: se conserva el actual.
 */
export function courtesyTarget(
  normal: Vec3,
  currentYaw: number,
  pitchLimit: number,
): { yaw: number; pitch: number } {
  const clampedY = Math.max(-1, Math.min(1, normal.y));
  const pitch = Math.max(-pitchLimit, Math.min(pitchLimit, Math.asin(clampedY)));

  let yaw: number;
  if (Math.abs(normal.y) > 0.999) {
    yaw = currentYaw;
  } else {
    yaw = Math.atan2(normal.x, normal.z);
    const TWO_PI = Math.PI * 2;
    yaw += Math.round((currentYaw - yaw) / TWO_PI) * TWO_PI;
  }
  return { yaw, pitch };
}

/** Aproximación exponencial de un ángulo hacia su objetivo (suave, sin rebote). */
export function approachAngle(
  current: number,
  target: number,
  rate: number,
  dtSeconds: number,
): number {
  const f = 1 - Math.exp(-rate * dtSeconds);
  return current + (target - current) * f;
}
