import React from 'react';
import './App.css';
import { BoardComponent } from './presentation/components/BoardComponent';
import { GameOverlay } from './presentation/components/GameOverlay';
import { computeBoardLayout } from './presentation/rendering/boardLayout';
import { useGameController } from './presentation/game/useGameController';
import { useBoardInput } from './presentation/input/useBoardInput';
import { SAMPLE_LEVEL } from './presentation/game/sampleLevel';

const BOARD_SIZE = 560;

/**
 * App — Demo interactiva del tablero (B1 + B3).
 *
 * Flujo de un toque:
 *   1. La capa de input resuelve la flecha tocada (B3).
 *   2. El controlador desliza la flecha tick-a-tick (un click = una jugada) hasta
 *      colisión o salida, reproyectando la forma real del dominio en cada paso.
 *   3. El input queda bloqueado mientras el slide está en vuelo.
 */
const App: React.FC = () => {
  const game = useGameController(SAMPLE_LEVEL);

  const layout = computeBoardLayout(game.viewModel.cells, BOARD_SIZE, BOARD_SIZE);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo: input deshabilitado en estado terminal o con un slide en vuelo.
    enabled: game.status === 'IN_PROGRESS' && !game.inFlight,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => game.playMove(command),
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <div className="app-stats">
          <div className="stat-moves">
            <span className="stat-label">Movimientos</span>
            <span className="stat-value">{game.movesRemaining}</span>
          </div>
          <div className="stat-status">
            {game.status === 'IN_PROGRESS' ? '▶ En juego' : `✓ ${game.status}`}
          </div>
        </div>
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
            board={game.viewModel}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={onPointerDown}
            collision={game.collision ?? undefined}
            vanishing={game.vanishing ?? undefined}
            headDisintegrating={game.headDisintegrating ?? undefined}
          />
          <GameOverlay status={game.status} score={game.score} />
        </div>
      </main>
    </div>
  );
};

export default App;
