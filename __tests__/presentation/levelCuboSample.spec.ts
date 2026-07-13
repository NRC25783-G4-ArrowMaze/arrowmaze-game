import { GameController } from '../../src/presentation/game/GameController';
import { LEVEL_CUBE_SAMPLE } from '../../src/presentation/game/levels/levelCuboSample';

/**
 * LEVEL_CUBE_SAMPLE — contrato del playtest de Fase 3.
 *
 * En una superficie cerrada un rayo sin obstáculo orbita PARA SIEMPRE, así
 * que la regla de diseño de los niveles cubo es: todo slide termina, en el
 * agujero negro ('destroyed') o en un bloqueo ('blocked'). Este spec juega la
 * muestra con el motor real y fija ese contrato para cada flecha.
 */

function slide(controller: GameController, arrowId: string): string | null {
  const maxTicks = 80;
  let outcome = controller.advanceTick(arrowId);
  for (let tick = 0; outcome === 'advanced' && tick < maxTicks; tick++) {
    outcome = controller.advanceTick(arrowId);
  }
  if (outcome !== null) {
    controller.commitSlide(outcome);
  }
  return outcome;
}

describe('LEVEL_CUBE_SAMPLE — muestra jugable del MODO CUBO', () => {
  it('carga en el motor real sin errores', () => {
    expect(() => new GameController(LEVEL_CUBE_SAMPLE)).not.toThrow();
  });

  it('roja y azul cruzan su arista y caen al agujero negro', () => {
    const controller = new GameController(LEVEL_CUBE_SAMPLE);
    expect(slide(controller, 'roja')).toBe('destroyed');
    expect(slide(controller, 'azul')).toBe('destroyed');
  });

  it('verde da la vuelta grande (frente→abajo→atrás→arriba) y es devorada', () => {
    const controller = new GameController(LEVEL_CUBE_SAMPLE);
    expect(slide(controller, 'verde')).toBe('destroyed');
  });

  it('naranja y muro se bloquean mutuamente: ningún tap del playtest cuelga', () => {
    const controller = new GameController(LEVEL_CUBE_SAMPLE);
    expect(slide(controller, 'naranja')).toBe('blocked');
    expect(slide(controller, 'muro')).toBe('blocked');
    // Y tras el intento, siguen bloqueadas (estado estable, sin órbitas).
    expect(slide(controller, 'naranja')).toBe('blocked');
  });

  it('ningún slide de la muestra supera el presupuesto de ticks (sin órbitas infinitas)', () => {
    for (const arrow of LEVEL_CUBE_SAMPLE.arrows) {
      const controller = new GameController(LEVEL_CUBE_SAMPLE);
      const outcome = slide(controller, arrow.id);
      expect(['destroyed', 'blocked']).toContain(outcome);
    }
  });
});
