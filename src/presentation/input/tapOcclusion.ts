/**
 * tapOcclusion — Regla de oclusión del tap (diseño aprobado, ajuste 4):
 * solo se juega lo que se VE. El raycast intersecta TODO (cubo + flechas)
 * ordenado por distancia; el primer impacto manda: si es una flecha, esa es
 * la jugada; si es geometría del cubo (tile/agujero), la flecha de atrás
 * queda ocluida y el tap se ignora.
 */

export interface TapHit {
  /** Id de flecha si el impacto pertenece a una flecha; null si es cubo. */
  arrowId: string | null;
}

/** Primer impacto decide: flecha → su id; cubo → null (ocluido). */
export function firstTapTarget(hits: ReadonlyArray<TapHit>): string | null {
  if (hits.length === 0) {
    return null;
  }
  return hits[0].arrowId;
}
