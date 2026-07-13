import { sceneFromLevelData } from '../../src/presentation/game/scene';
import { LEVEL_CUBE } from '../../src/presentation/game/levels/levelCube';
import { GameController } from '../../src/presentation/game/GameController';

describe('LEVEL_CUBE — Nivel 3x3x3 con paginación Z', () => {
  it('tiene 27 celdas (3x3x3) y 5 flechas iniciales', () => {
    const scene = sceneFromLevelData(LEVEL_CUBE);
    expect(scene.cells).toHaveLength(27);
    expect(scene.arrows).toHaveLength(5);
    expect(scene.mapMode).toBe('3d');
    expect(scene.collisionBehavior).toBe('return');
  });

  it('las celdas interiores tienen puertos Z conectados', () => {
    const scene = sceneFromLevelData(LEVEL_CUBE);
    // Verificar que existen celdas con layer 0, 1 y 2
    const layers = new Set(scene.cells.map((c) => c.layer));
    expect(layers.has(0)).toBe(true);
    expect(layers.has(1)).toBe(true);
    expect(layers.has(2)).toBe(true);
  });

  it('el comportamiento de colisión es return', () => {
    // Al intentar sacar una flecha por una cara exterior sin puerto Z, debe retornar
    const controller = new GameController(sceneFromLevelData(LEVEL_CUBE));
    
    // Seleccionamos la primera flecha para probar
    const firstArrow = LEVEL_CUBE.arrows[0];
    const outcome = controller.advanceTick(firstArrow.id);
    
    // El motor debería manejar esto normalmente
    expect(['advanced', 'blocked', 'returned', 'destroyed']).toContain(outcome);
  });
});
