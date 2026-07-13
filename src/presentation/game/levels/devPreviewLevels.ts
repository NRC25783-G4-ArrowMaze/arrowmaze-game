import type { Scene } from '../scene';
import { LEVEL_CUBE_SAMPLE } from './levelCuboSample';
import { LEVEL_EL_HUECO } from './levelElHueco';

/**
 * DEV_PREVIEW_LEVELS — Niveles de vitrina/playtest NO publicados en el mapa.
 *
 * Se juegan solo vía la entrada dev de App (?level=<id>): no aparecen en
 * LEVEL_MAP ni en LOCAL_LEVELS, así que no alteran la progresión C3 ni el
 * contrato del catálogo (localLevels.spec).
 */
export const DEV_PREVIEW_LEVELS: Record<string, Scene> = {
  'cubo-sample': LEVEL_CUBE_SAMPLE,
  'el-hueco': LEVEL_EL_HUECO,
};
