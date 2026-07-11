import { GameController } from '../../src/presentation/game/GameController';
import { LOCAL_LEVELS } from '../../src/presentation/game/levels/localLevels';
import { LEVEL_MAP } from '../../src/presentation/game/levelMap';
import type { Scene } from '../../src/presentation/game/scene';

/**
 * Catálogo de niveles locales (distribuible offline) — contrato con el mapa C3
 * y resolubilidad real de cada nivel.
 *
 * La resolubilidad no se afirma en abstracto: se JUEGA cada nivel con el motor
 * (GameController: advanceTick en bucle + commitSlide, la misma consolidación
 * "1 tap = 1 jugada" de la UI) siguiendo un orden de taps conocido, y se exige
 * que cada tap termine en 'destroyed' y la sesión en WON dentro del presupuesto.
 */

/** Orden de resolución conocido de cada nivel (un tap por flecha, sin bloqueos). */
const SOLVE_ORDERS: Record<string, string[]> = {
  // Azul y naranja escapan libres; verde necesita que naranja libere (2,2).
  'level-initial': ['blue', 'orange', 'green'],
  // Teselado de sample-level-2: primero los que escapan por el borde S.
  'level-intermediate-a': ['cyan', 'rose', 'orange', 'magenta', 'violet', 'green', 'amber', 'blue'],
  // NOTA: 'heart-preview' (corazón de 13 flechas del FORGE, último nivel) NO se
  // lista aquí a propósito — es un nivel-vitrina con forma de icono cuyo orden de
  // resolución no está cerrado. El test de "carga sin errores" sí lo cubre.
  // Oleadas por fila: el bloque del lado de escape libera a sus vecinos.
  'level-intermediate-b': [
    'top-right', 'top-mid', 'top-left',
    'mid-left', 'mid-mid', 'mid-right',
    'bottom-right', 'bottom-mid', 'bottom-left',
  ],
  // Molinete roto: left es la llave; el perímetro cae en cadena y las filas
  // interiores salen por el lado ya liberado.
  'level-advanced': ['left', 'row-2', 'row-4', 'bottom', 'right', 'row-1', 'row-3', 'top'],
  // Molinetes anidados: anillo exterior → anillo interior → núcleo.
  'level-expert': [
    'outer-left', 'outer-bottom', 'outer-right', 'inner-left', 'inner-bottom',
    'core-hook', 'inner-right', 'core-tail', 'inner-top', 'outer-top',
  ],
};

/** Desliza una flecha hasta su outcome terminal y consolida la jugada (como la UI). */
function slide(controller: GameController, arrowId: string): string | null {
  const maxTicks = 200; // cota defensiva anti-bucle
  let outcome = controller.advanceTick(arrowId);
  for (let tick = 0; outcome === 'advanced' && tick < maxTicks; tick++) {
    outcome = controller.advanceTick(arrowId);
  }
  if (outcome !== null) {
    controller.commitSlide(outcome);
  }
  return outcome;
}

describe('Catálogo de niveles locales (offline)', () => {
  it('cubre exactamente los levelId del LEVEL_MAP y cada Scene lleva ese id', () => {
    const mapIds = LEVEL_MAP.map((n) => n.levelId).sort();
    const catalogIds = Object.keys(LOCAL_LEVELS).sort();
    expect(catalogIds).toEqual(mapIds);

    for (const [levelId, scene] of Object.entries(LOCAL_LEVELS)) {
      // scene.id === levelId es lo que enlaza el progreso (D1) con el desbloqueo (C3).
      expect(scene.id).toBe(levelId);
    }
  });

  it('cada nivel carga en el motor sin errores de topología ni solapes', () => {
    for (const scene of Object.values(LOCAL_LEVELS)) {
      // El constructor valida vía LevelLoader (conectividad, ocupación, colisiones).
      expect(() => new GameController(scene as Scene)).not.toThrow();
    }
  });

  describe.each(Object.entries(SOLVE_ORDERS))('nivel %s', (levelId, order) => {
    it('es resoluble con un tap por flecha dentro del presupuesto', () => {
      const scene = LOCAL_LEVELS[levelId];
      expect(scene.arrows.map((a) => a.id).sort()).toEqual([...order].sort());
      expect(order.length).toBeLessThanOrEqual(scene.allowedMoves);

      const controller = new GameController(scene);
      for (const arrowId of order) {
        const outcome = slide(controller, arrowId);
        // Si esto falla, el orden de escape del nivel está mal diseñado.
        expect({ arrowId, outcome }).toEqual({ arrowId, outcome: 'destroyed' });
      }

      expect(controller.status).toBe('WON');
      expect(controller.score).not.toBeNull();
    });
  });
});
