import type { ILevelApiClient } from '../../application/ports/ILevelApiClient';
import { sceneFromLevelData, type Scene } from './scene';

/**
 * Carga la escena remota con fallback offline-first (F2): si el fetch falla
 * (sin red, backend caído, 404, payload malformado) se devuelve la escena
 * local sin romper el arranque — un único punto de captura para todo el camino
 * red → DTO → Scene.
 */
export async function fetchSceneWithFallback(
  client: ILevelApiClient,
  levelId: string,
  fallback: Scene,
): Promise<Scene> {
  try {
    return sceneFromLevelData(await client.fetchLevel(levelId));
  } catch (error) {
    console.warn(
      `[loadScene] No se pudo cargar el nivel remoto "${levelId}"; usando la escena local.`,
      error,
    );
    return fallback;
  }
}
