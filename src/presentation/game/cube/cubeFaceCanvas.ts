import type { CubeFace, Vec3 } from './cubeTopology';

/**
 * cubeFaceCanvas — Matemática pura del pintado por cara (técnica ratificada:
 * lienzos CanvasTexture, uno por cara).
 *
 * El glifo 2D se dibuja en coordenadas LOCALES de cada cara; una polilínea que
 * cruza una arista se PARTE exactamente en el plano bisector de las dos caras
 * y cada mitad se pinta en su lienzo: las dos mitades se encuentran en la
 * arista física → el pliegue real (Opción A del diseño). Sin three ni DOM:
 * todo testeable.
 */

export interface FacePoint {
  x: number;
  y: number;
}

export interface FaceRun {
  faceIndex: number;
  /** Polilínea en coordenadas locales de la cara, en unidades de CELDA. */
  points: FacePoint[];
  /** True si este tramo contiene la punta (último punto del cuerpo). */
  isLead: boolean;
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function lerp3(a: Vec3, b: Vec3, f: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
  };
}

/** Proyección de un punto 3D al marco local (u,v) de una cara, en celdas. */
export function projectToFace(face: CubeFace, p: Vec3): FacePoint {
  const rel = { x: p.x - face.origin.x, y: p.y - face.origin.y, z: p.z - face.origin.z };
  return { x: dot(rel, face.u), y: dot(rel, face.v) };
}

/** Proyección de una dirección 3D al marco local de una cara (sin normalizar). */
export function projectDirToFace(face: CubeFace, dir: Vec3): FacePoint {
  return { x: dot(dir, face.u), y: dot(dir, face.v) };
}

/**
 * "Altura" de un punto sobre el plano de una cara (positiva del lado exterior).
 * Para un punto elevado sobre su propia cara vale exactamente el lift; para
 * las demás caras es ≤ 0 dentro de la piel del cubo.
 */
function faceScore(face: CubeFace, p: Vec3): number {
  return dot(p, face.normal) - dot(face.origin, face.normal);
}

/** Índice de la cara a la que pertenece un punto de superficie (argmax score). */
export function faceIndexOfPoint(faces: readonly CubeFace[], p: Vec3): number {
  let best = 0;
  let bestScore = -Infinity;
  for (const face of faces) {
    const s = faceScore(face, p);
    if (s > bestScore) {
      bestScore = s;
      best = face.index;
    }
  }
  return best;
}

/**
 * Ajusta el punto de corte al borde exacto del lienzo: la cuerda 3D elevada
 * corta la esquina del pliegue, así que su bisector proyecta unas décimas
 * ADENTRO de cada cara — se snapea la coordenada más cercana a una frontera
 * (0 o S) para que ambas mitades del glifo TOQUEN la arista sin hueco.
 */
function snapToBorder(p: FacePoint, size: number): FacePoint {
  const candidates: Array<{ axis: 'x' | 'y'; value: number; distance: number }> = [
    { axis: 'x', value: 0, distance: Math.abs(p.x) },
    { axis: 'x', value: size, distance: Math.abs(p.x - size) },
    { axis: 'y', value: 0, distance: Math.abs(p.y) },
    { axis: 'y', value: size, distance: Math.abs(p.y - size) },
  ];
  candidates.sort((a, b) => a.distance - b.distance);
  const snap = candidates[0];
  return snap.axis === 'x' ? { x: snap.value, y: p.y } : { x: p.x, y: snap.value };
}

/**
 * Parte una polilínea 3D (cuerpo del glifo sobre la superficie) en tramos por
 * cara. El corte entre dos puntos de caras distintas se hace donde ambas caras
 * "pesan" igual (plano bisector), snapeado a la arista: las dos mitades del
 * glifo se encuentran exactamente en el borde de sus lienzos.
 */
export function splitBodyByFace(
  faces: readonly CubeFace[],
  body: readonly Vec3[],
): FaceRun[] {
  if (body.length === 0) {
    return [];
  }
  // Tamaño de cara S: el offset del plano de cualquier cara de normal positiva
  // (las de normal negativa tienen plano en 0, por eso se toma el máximo).
  const size = Math.max(...faces.map((f) => Math.abs(dot(f.origin, f.normal))));
  const runs: FaceRun[] = [];
  let currentFace = faceIndexOfPoint(faces, body[0]);
  let current: FacePoint[] = [projectToFace(faces[currentFace], body[0])];

  for (let i = 1; i < body.length; i++) {
    const p = body[i];
    const f = faceIndexOfPoint(faces, p);
    if (f === currentFace) {
      current.push(projectToFace(faces[f], p));
      continue;
    }
    // Cruce de arista: buscar t donde score_actual == score_nueva (lineal en t).
    const prev = body[i - 1];
    const sA0 = faceScore(faces[currentFace], prev) - faceScore(faces[f], prev);
    const sA1 = faceScore(faces[currentFace], p) - faceScore(faces[f], p);
    const denom = sA0 - sA1;
    const t = denom === 0 ? 0.5 : Math.max(0, Math.min(1, sA0 / denom));
    const split = lerp3(prev, p, t);

    current.push(snapToBorder(projectToFace(faces[currentFace], split), size));
    runs.push({ faceIndex: currentFace, points: current, isLead: false });

    currentFace = f;
    current = [snapToBorder(projectToFace(faces[f], split), size), projectToFace(faces[f], p)];
  }

  runs.push({ faceIndex: currentFace, points: current, isLead: true });
  return runs;
}

/**
 * Warp suave de pintado hacia los CENTROS VISUALES de las piezas (arte v4.3).
 *
 * Las piezas de borde/esquina llegan hasta la arista, así que su tapa está
 * corrida `shift` hacia el filo respecto al centro de la celda lógica. Este
 * remapeo por eje alinea el pintado (dots y glifos) con las tapas reales:
 *  - 0 y S quedan FIJOS (el empalme del pliegue entre lienzos no se mueve);
 *  - el centro lógico de la celda de borde (0.5 / S−0.5) va al centro visual
 *    de su pieza (0.5∓shift... exactamente 0.5−shift y S−0.5+shift);
 *  - el interior (1.5 … S−1.5) es identidad.
 * Lineal por tramos: los cuerpos rectos junto a la arista se curvan de forma
 * imperceptible y la coherencia reposo/movimiento es total (cero saltos).
 * Solo pintado: riel, hit-targets y lógica no cambian.
 */
export function warpToPieceCenters(
  p: FacePoint,
  size: number,
  shift: number,
): FacePoint {
  const warpAxis = (x: number): number => {
    if (x <= 0.5) {
      return x * ((0.5 - shift) / 0.5);
    }
    if (x < 1.5) {
      return (0.5 - shift) + (x - 0.5) * ((1.5 - (0.5 - shift)) / 1);
    }
    if (x <= size - 1.5) {
      return x;
    }
    if (x < size - 0.5) {
      const start = size - 1.5;
      return start + (x - start) * (((size - 0.5 + shift) - start) / 1);
    }
    return (size - 0.5 + shift) + (x - (size - 0.5)) * ((0.5 - shift) / 0.5);
  };
  return { x: warpAxis(p.x), y: warpAxis(p.y) };
}

/**
 * Segmento 3D de la arista compartida entre dos caras (para el pulso de brillo
 * de ~120ms al cruzar). Null si las caras no comparten arista (paralelas).
 */
export function sharedEdgeSegment(
  faceA: CubeFace,
  faceB: CubeFace,
  size: number,
): { from: Vec3; to: Vec3 } | null {
  const nA = faceA.normal;
  const nB = faceB.normal;
  if (Math.abs(dot(nA, nB)) > 0.5) {
    return null; // misma cara u opuesta: no hay arista compartida
  }
  const axisOf = (n: Vec3): 'x' | 'y' | 'z' => (n.x !== 0 ? 'x' : n.y !== 0 ? 'y' : 'z');
  const axisA = axisOf(nA);
  const axisB = axisOf(nB);
  const valueOf = (face: CubeFace, axis: 'x' | 'y' | 'z'): number =>
    face.normal[axis] > 0 ? size : 0;

  const from: Vec3 = { x: 0, y: 0, z: 0 };
  from[axisA] = valueOf(faceA, axisA);
  from[axisB] = valueOf(faceB, axisB);
  const to: Vec3 = { ...from };
  const freeAxis: 'x' | 'y' | 'z' = axisA !== 'x' && axisB !== 'x' ? 'x' : axisA !== 'y' && axisB !== 'y' ? 'y' : 'z';
  to[freeAxis] = size;
  return { from, to };
}
