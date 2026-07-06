import { SAMPLE_LEVEL_2 } from '../src/presentation/game/sampleLevel2';
import { HEART_SCENE } from '../src/presentation/preview/heartScene';
import { toLevelDataDTO } from '../src/presentation/game/scene';

/**
 * export-levels-seed — Exporta los niveles locales al JSON de seed del backend (F2).
 *
 * Proyecta cada Scene con toLevelDataDTO() (contrato C2: sin col/row ni color) y
 * añade name/difficulty, requeridos por el catálogo (`GET /api/v1/levels`).
 * Los IDs se conservan tal cual: el progreso local del jugador se guarda por levelId.
 *
 * Uso (desde la raíz del repo):
 *   pnpm dlx tsx scripts/export-levels-seed.ts > ../arrowmaze-backend/seeds/levels.seed.json
 *
 * Volver a ejecutarlo cuando cambie la definición de un nivel distribuido.
 */

const seed = [
  { ...toLevelDataDTO(SAMPLE_LEVEL_2), name: 'Laberinto 6×6', difficulty: 'medium' },
  { ...toLevelDataDTO(HEART_SCENE), name: 'Corazón', difficulty: 'easy' },
];

process.stdout.write(JSON.stringify(seed, null, 2) + '\n');
