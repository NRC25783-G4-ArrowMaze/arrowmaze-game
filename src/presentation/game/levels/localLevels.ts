import { sceneFromLevelData, type Scene } from '../scene';
import { SAMPLE_LEVEL } from '../sampleLevel';
import { SAMPLE_LEVEL_2 } from '../sampleLevel2';
import { LEVEL_HEART } from './levelHeart';
import { LEVEL_INTERMEDIATE_B } from './levelIntermediateB';
import { LEVEL_ADVANCED } from './levelAdvanced';
import { LEVEL_EXPERT } from './levelExpert';

/**
 * localLevels — Catálogo de niveles locales del distribuible offline.
 *
 * Cada entrada se indexa por el `levelId` del LEVEL_MAP (C3) y su Scene lleva
 * ese MISMO id: el progreso se guarda bajo scene.id (D1) y la proyección de
 * desbloqueo compara contra levelId, así que la igualdad de ambos es lo que
 * hace que ganar un nivel desbloquee el siguiente en el mapa.
 *
 * Los dos primeros reutilizan las escenas de muestra (re-identificadas); el
 * resto se define como LevelDataDTO — el mismo contrato que exporta el FORGE —
 * y cualquiera puede sustituirse por un JSON del editor sin tocar más código.
 */
export const LOCAL_LEVELS: Record<string, Scene> = {
  'level-initial': { ...SAMPLE_LEVEL, id: 'level-initial' },
  'level-intermediate-a': { ...SAMPLE_LEVEL_2, id: 'level-intermediate-a' },
  'level-intermediate-b': sceneFromLevelData(LEVEL_INTERMEDIATE_B),
  'level-advanced': sceneFromLevelData(LEVEL_ADVANCED),
  'level-expert': sceneFromLevelData(LEVEL_EXPERT),
  // Corazón (13 flechas, diseñado en el FORGE) como ÚLTIMO nivel. Su id es
  // 'heart-preview' (registrado en el backend → leaderboards sin 404).
  'heart-preview': sceneFromLevelData(LEVEL_HEART),
};
