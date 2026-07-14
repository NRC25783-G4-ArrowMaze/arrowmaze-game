import { sceneFromLevelData } from '../../src/presentation/game/scene';
import { LEVEL_CUBE } from '../../src/presentation/game/levels/levelCube';
import { GameController } from '../../src/presentation/game/GameController';

describe('LEVEL_CUBE Integration', () => {
  it('should allow arrows to exit in the correct sequence', () => {
    const scene = sceneFromLevelData(LEVEL_CUBE);
    const controller = new GameController(scene);

    // Puzzle sequence:
    // 1. rose
    // 2. amber
    // 3. cyan
    // 4. violet
    // 5. magenta
    // The specific correct unblocking sequence for the 3D interlocking puzzle
    const sequence = ['blue', 'rose', 'orange', 'green', 'cyan', 'amber', 'magenta', 'violet'];
    
    for (const arrowId of sequence) {
      let result = controller.advanceTick(arrowId);
      expect(['advanced', 'destroyed']).toContain(result);
      
      while (result === 'advanced') {
        result = controller.advanceTick(arrowId);
        if (result === 'destroyed') {
          break;
        } else if (result !== 'advanced') {
          throw new Error(`Unexpected result for ${arrowId}: ${result}`);
        }
      }
      expect(result).toBe('destroyed');
    }

    // After the sequence, all arrows should be gone
    for (const arrowId of sequence) {
      const arrow = controller['arrowsById'].get(arrowId);
      expect(arrow).toBeUndefined();
    }
  });
});
