import { GameController } from '../../src/presentation/game/GameController';
import { LOCAL_LEVELS } from '../../src/presentation/game/levels/localLevels';
import { TUTORIAL_LEVEL_ID, TUTORIAL_STEPS } from '../../src/presentation/game/tutorial/tutorialScript';

/**
 * El tutorial guiado GUÍA TODA LA SOLUCIÓN: la secuencia de flechas que la manito
 * señala paso a paso debe resolver realmente el primer nivel. Si el orden fuese
 * incorrecto (p. ej. una flecha bloqueada por otra aún presente), el jugador
 * seguiría la guía y NO ganaría — este test lo impide.
 */
function slide(controller: GameController, arrowId: string): string | null {
  let outcome = controller.advanceTick(arrowId);
  for (let tick = 0; outcome === 'advanced' && tick < 200; tick++) {
    outcome = controller.advanceTick(arrowId);
  }
  if (outcome !== null) controller.commitSlide(outcome);
  return outcome;
}

describe('Guion del tutorial', () => {
  it('apunta a flechas reales del nivel-tutorial', () => {
    const scene = LOCAL_LEVELS[TUTORIAL_LEVEL_ID];
    const arrowIds = new Set(scene.arrows.map((a) => a.id));
    for (const step of TUTORIAL_STEPS) {
      expect(arrowIds.has(step)).toBe(true);
    }
  });

  it('la secuencia guiada resuelve el nivel (cada paso destruye su flecha, WON)', () => {
    const scene = LOCAL_LEVELS[TUTORIAL_LEVEL_ID];
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(scene.allowedMoves);

    const controller = new GameController(scene);
    for (const arrowId of TUTORIAL_STEPS) {
      expect({ arrowId, outcome: slide(controller, arrowId) }).toEqual({ arrowId, outcome: 'destroyed' });
    }
    expect(controller.status).toBe('WON');
  });
});
