import { LEVEL_CUBE } from '../../src/presentation/game/levels/levelCube';
import { GameController } from '../../src/presentation/game/GameController';
import { sceneFromLevelData } from '../../src/presentation/game/scene';

const scene = sceneFromLevelData(LEVEL_CUBE);
const controller = new GameController(scene);

const arrowId = 'rose';
console.log(`Starting ${arrowId}`);

// We need to look at the cells of Rose before advance
const vmBefore = controller.viewModel().arrows.find(a => a.id === arrowId);
console.log('Before advance:', vmBefore);

const outcome = controller.advanceTick(arrowId);
console.log('Outcome:', outcome);

const vmAfter = controller.viewModel().arrows.find(a => a.id === arrowId);
console.log('After advance:', vmAfter);
