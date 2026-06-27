import React, { useMemo } from 'react'
import { ArrowComponent } from '../components/ArrowComponent'
import { GameOverlay } from '../components/GameOverlay'
import {
  computeBoardLayout,
  cellCenter,
  boundingBoxPositions,
  type Point,
} from '../rendering/boardLayout'
import { useGameController } from '../game/useGameController'
import { useTickAnimation } from '../game/useTickAnimation'
import { useBoardInput } from '../input/useBoardInput'
import { MOCK_SCENE } from './mockScene'
import type { BoardViewModel } from '../viewModel'

/**
 * NeonInteractiveBoard — Tablero INTERACTIVO con estética neón para la página oculta.
 *
 * Reutiliza el stack existente sin modificarlo:
 *   - useGameController: estado del juego (motor real, PlayMoveUseCase).
 *   - useBoardInput / useTickAnimation: click → tick → animación.
 *   - ArrowComponent: el render de flecha tradicional (cuerpo + punta).
 *
 * Lo único propio es la "carcasa" SVG: fondo oscuro, grilla de puntos tenue y un
 * filtro de glow por color. Haz click en una flecha para avanzarla.
 */

const SIZE = 480

const NeonInteractiveBoard: React.FC = () => {
  const game = useGameController(MOCK_SCENE)
  const anim = useTickAnimation()
  const layout = computeBoardLayout(game.viewModel.cells, SIZE, SIZE)

  // Durante el fade de "destroyed" re-inyectamos la flecha fantasma para verla salir.
  const viewModel: BoardViewModel = useMemo(() => {
    if (anim.ghostArrow === null) {
      return game.viewModel
    }
    return {
      cells: game.viewModel.cells,
      arrows: [...game.viewModel.arrows, anim.ghostArrow],
    }
  }, [game.viewModel, anim.ghostArrow])

  const onPointerDown = useBoardInput({
    width: SIZE,
    height: SIZE,
    layout,
    enabled: game.status === 'IN_PROGRESS' && !anim.inFlight,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => {
      const preArrow = game.viewModel.arrows.find((a) => a.id === command.arrowId)
      if (preArrow === undefined) {
        return
      }
      const result = game.playMove(command)
      if (result === null || !result.success || result.outcome === undefined) {
        return
      }
      anim.run({
        arrowId: command.arrowId,
        preArrow,
        outcome: result.outcome,
        cellSize: layout.cellSize,
      })
    },
  })

  const { maxCol, maxRow, cellSize, offset } = layout
  const centerById = new Map<string, Point>(
    viewModel.cells.map((c) => [c.id, cellCenter(c.col, c.row, cellSize, offset)]),
  )
  const dots = boundingBoxPositions(maxCol, maxRow)

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onPointerDown={onPointerDown}
        style={{ touchAction: 'none', width: '100%', height: 'auto', borderRadius: 20 }}
        role="img"
        aria-label="Tablero neón interactivo (maze mock)"
      >
        <defs>
          <filter id="neon-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={cellSize * 0.06} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={SIZE} height={SIZE} rx={20} fill="#0a0e1a" />

        <g opacity={0.5}>
          {dots.map(({ col, row }) => {
            const c = cellCenter(col, row, cellSize, offset)
            return (
              <circle key={`${col},${row}`} cx={c.x} cy={c.y} r={cellSize * 0.05} fill="#22305a" />
            )
          })}
        </g>

        {viewModel.arrows.map((arrow) => {
          const centers = arrow.cellIds
            .map((id) => centerById.get(id))
            .filter((p): p is Point => p !== undefined)
          return (
            <g key={arrow.id} filter="url(#neon-glow)">
              <ArrowComponent
                color={arrow.color}
                centers={centers}
                exitDir={arrow.exitDir}
                cellSize={cellSize}
                motion={anim.motions.get(arrow.id)}
              />
            </g>
          )
        })}
      </svg>

      <GameOverlay status={game.status} score={game.score} />

      <p style={{ marginTop: 16, textAlign: 'center', opacity: 0.7 }}>
        Movimientos: {game.movesRemaining} · Estado: {game.status} — haz click en una flecha
      </p>
    </div>
  )
}

export default NeonInteractiveBoard
