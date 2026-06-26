import React, { useMemo } from 'react';
import './App.css';
import { BoardComponent } from './presentation/components/BoardComponent';
import { GameOverlay } from './presentation/components/GameOverlay';
import { computeBoardLayout } from './presentation/rendering/boardLayout';
import { useGameController } from './presentation/game/useGameController';
import { useTickAnimation } from './presentation/game/useTickAnimation';
import { useBoardInput } from './presentation/input/useBoardInput';
import { SAMPLE_LEVEL } from './presentation/game/sampleLevel';
import type { BoardViewModel } from './presentation/viewModel';

const BOARD_SIZE = 420;

/**
 * App — Demo interactiva del tablero con animaciones (B1 + B2 + B3).
 *
 * Flujo de un toque:
 *   1. La capa de input resuelve la flecha tocada (B3).
 *   2. Se captura el estado PREVIO de esa flecha.
 *   3. El motor ejecuta UN tick (PlayMoveUseCase) → outcome advanced/blocked/destroyed.
 *   4. La capa de animación reproduce la coreografía y bloquea el input mientras dura.
 *
 * La animación es puramente visual: el estado del juego lo decide el motor.
 */
const App: React.FC = () => {
  const game = useGameController(SAMPLE_LEVEL);
  const anim = useTickAnimation();

  const layout = computeBoardLayout(game.viewModel.cells, BOARD_SIZE, BOARD_SIZE);

  // Durante un fade de destroyed, re-inyectamos la flecha "fantasma" para verla
  // desvanecer (el motor ya la eliminó del estado).
  const viewModel: BoardViewModel = useMemo(() => {
    if (anim.ghostArrow === null) {
      return game.viewModel;
    }
    return {
      cells: game.viewModel.cells,
      arrows: [...game.viewModel.arrows, anim.ghostArrow],
    };
  }, [game.viewModel, anim.ghostArrow]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo: input deshabilitado en estado terminal o con un tick en vuelo.
    enabled: game.status === 'IN_PROGRESS' && !anim.inFlight,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => {
      const preArrow = game.viewModel.arrows.find((a) => a.id === command.arrowId);
      if (preArrow === undefined) {
        return;
      }
      const result = game.playMove(command);
      if (result === null || !result.success || result.outcome === undefined) {
        return;
      }
      anim.run({
        arrowId: command.arrowId,
        preArrow,
        outcome: result.outcome,
        cellSize: layout.cellSize,
      });
    },
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <p>
          Movimientos: {game.movesRemaining} · Estado: {game.status}
        </p>
      </header>
      <main className="app-main">
        <div
          style={{
            position: 'relative',
            width: BOARD_SIZE,
            height: BOARD_SIZE,
          }}
        >
          <BoardComponent
            board={viewModel}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={onPointerDown}
            motions={anim.motions}
          />
          <GameOverlay status={game.status} score={game.score} />
        </div>
      </main>
    </div>
  );
};

export default App;
