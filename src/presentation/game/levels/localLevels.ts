import { sceneFromLevelData, type Scene } from '../scene';
import { SAMPLE_LEVEL } from '../sampleLevel';
import { SAMPLE_LEVEL_2 } from '../sampleLevel2';
import { LEVEL_HEART } from './levelHeart';
import { LEVEL_INTERMEDIATE_B } from './levelIntermediateB';
import { LEVEL_ADVANCED } from './levelAdvanced';
import { LEVEL_EXPERT } from './levelExpert';
import { LEVEL_MAPA_06 } from './levelMapa06';
import { LEVEL_MAPA_07 } from './levelMapa07';
import { LEVEL_MAPA_08 } from './levelMapa08';
import { LEVEL_MAPA_09 } from './levelMapa09';
import { LEVEL_MAPA_10 } from './levelMapa10';
import { LEVEL_MAPA_11 } from './levelMapa11';
import { LEVEL_MAPA_12 } from './levelMapa12';
import { LEVEL_MAPA_13 } from './levelMapa13';
import { LEVEL_MAPA_14 } from './levelMapa14';
import { LEVEL_MAPA_15 } from './levelMapa15';

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
  // Mapas 6-15: borradores generados para el FORGE (5 medios ≥16×16 y 5
  // difíciles; el 10 y el 15 sobre formas no cuadriculadas: rombo y anillo).
  'mapa-06': sceneFromLevelData(LEVEL_MAPA_06),
  'mapa-07': sceneFromLevelData(LEVEL_MAPA_07),
  'mapa-08': sceneFromLevelData(LEVEL_MAPA_08),
  'mapa-09': sceneFromLevelData(LEVEL_MAPA_09),
  'mapa-10': sceneFromLevelData(LEVEL_MAPA_10),
  'mapa-11': sceneFromLevelData(LEVEL_MAPA_11),
  'mapa-12': sceneFromLevelData(LEVEL_MAPA_12),
  'mapa-13': sceneFromLevelData(LEVEL_MAPA_13),
  'mapa-14': sceneFromLevelData(LEVEL_MAPA_14),
  'mapa-15': sceneFromLevelData(LEVEL_MAPA_15),
  // Corazón (13 flechas, diseñado en el FORGE) como ÚLTIMO nivel. Su id es
  // 'heart-preview' (registrado en el backend → leaderboards sin 404).
  'heart-preview': sceneFromLevelData(LEVEL_HEART),
};
