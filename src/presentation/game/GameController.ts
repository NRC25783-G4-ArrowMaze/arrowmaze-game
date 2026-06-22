import { Board } from '../../domain/entities/Board';
import { Arrow } from '../../domain/entities/Arrow';
import type { ArrowSegment } from '../../domain/entities/ArrowSegment';
import { GameSession, type GameStatus } from '../../domain/entities/GameSession';
import { PlayMoveUseCase } from '../../application/use-cases/PlayMoveUseCase';
import { AdvanceArrowUseCase } from '../../application/use-cases/AdvanceArrowUseCase';
import { LevelLoader } from '../../application/use-cases/LevelLoader';
import { LevelDataBoardBuilder } from '../../application/services/LevelDataBoardBuilder';
import { LevelDataArrowBuilder } from '../../application/services/LevelDataArrowBuilder';
import type { PlayMoveResult } from '../../application/dtos/SessionDTOs';
import type { BoardViewModel } from '../viewModel';
import type { PlayMoveCommand } from '../input/PlayMoveCommand';
import { type Scene, toLevelDataDTO } from './scene';

/**
 * GameController — Orquestador de presentación que conecta el input/animaciones
 * con el motor ya existente (PlayMoveUseCase).
 *
 * Responsabilidades:
 *   - Construir el estado inicial (Board + Arrows vivos + GameSession) desde una Scene.
 *   - Exponer un view-model proyectado del estado actual para el renderer (B1).
 *   - Resolver qué flecha ocupa una celda dada (apoyo a B3).
 *   - Ejecutar un tick vía PlayMoveUseCase y reflejar movesRemaining / status.
 *
 * NO contiene lógica de juego: toda regla (avance, colisión, destrucción, fin de
 * partida, puntaje) vive en el dominio/aplicación. Este controlador solo cablea.
 */
export class GameController {
  private readonly board: Board;
  private readonly session: GameSession;
  private readonly playMoveUseCase: PlayMoveUseCase;

  /** Flechas vivas por id. Una flecha destruida se elimina de este mapa. */
  private readonly arrowsById: Map<string, Arrow>;
  /** Color de presentación por id de flecha (el dominio no modela color). */
  private readonly colorById: Map<string, string>;
  /** Posición de rejilla por id de celda (el dominio no modela col/row). */
  private readonly layoutByCellId: Map<string, { col: number; row: number }>;
  /** Id de celda por "col,row" para invertir el toque a una celda del dominio. */
  private readonly cellIdByPosition: Map<string, string>;

  constructor(scene: Scene) {
    const loader = new LevelLoader(
      new LevelDataBoardBuilder(),
      new LevelDataArrowBuilder(),
    );
    const { board, arrows } = loader.load(toLevelDataDTO(scene));

    this.board = board;
    this.session = new GameSession(scene.allowedMoves);
    this.playMoveUseCase = new PlayMoveUseCase(new AdvanceArrowUseCase());

    // El builder devuelve las flechas en el mismo orden que scene.arrows.
    this.arrowsById = new Map(
      scene.arrows.map((a, i) => [a.id, arrows[i]] as const),
    );
    this.colorById = new Map(scene.arrows.map((a) => [a.id, a.color] as const));
    this.layoutByCellId = new Map(
      scene.cells.map((c) => [c.id, { col: c.col, row: c.row }] as const),
    );
    this.cellIdByPosition = new Map(
      scene.cells.map((c) => [`${c.col},${c.row}`, c.id] as const),
    );
  }

  // ─────────────────────────────────────────────
  // ESTADO DE SESIÓN
  // ─────────────────────────────────────────────

  get status(): GameStatus {
    return this.session.status;
  }

  get movesRemaining(): number {
    return this.session.movesRemaining;
  }

  get score(): number | null {
    return this.session.score === null ? null : this.session.score.finalScore;
  }

  // ─────────────────────────────────────────────
  // PROYECCIÓN AL VIEW-MODEL (B1)
  // ─────────────────────────────────────────────

  /** Proyecta el estado vivo actual al view-model que consume BoardComponent. */
  viewModel(): BoardViewModel {
    const cells = Array.from(this.layoutByCellId.entries()).map(
      ([id, { col, row }]) => ({ id, col, row }),
    );

    const arrows = Array.from(this.arrowsById.entries()).map(([id, arrow]) => ({
      id,
      color: this.colorById.get(id) ?? '#000000',
      cellIds: this.chainCellIds(arrow),
      exitDir: arrow.head.exitPort,
    }));

    return { cells, arrows };
  }

  // ─────────────────────────────────────────────
  // CONSULTA DE OCUPACIÓN (B3)
  // ─────────────────────────────────────────────

  /**
   * Resuelve qué flecha ocupa la celda de rejilla (col,row), o null si está
   * vacía o fuera del tablero. Recorre las cadenas vivas: cada celda la ocupa
   * a lo sumo una flecha.
   */
  resolveArrowIdAt(col: number, row: number): string | null {
    const cellId = this.cellIdByPosition.get(`${col},${row}`);
    if (cellId === undefined) {
      return null;
    }
    for (const [id, arrow] of this.arrowsById) {
      if (this.chainCellIds(arrow).includes(cellId)) {
        return id;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // EJECUCIÓN DE UN TICK (motor)
  // ─────────────────────────────────────────────

  /**
   * Ejecuta un tick para la flecha del comando vía PlayMoveUseCase y refleja el
   * resultado en la sesión. Si la flecha se destruyó, se retira del mapa de vivas.
   *
   * @returns El PlayMoveResult del motor, o null si la flecha no existe.
   */
  playMove(command: PlayMoveCommand): PlayMoveResult | null {
    const arrow = this.arrowsById.get(command.arrowId);
    if (arrow === undefined) {
      return null;
    }

    const result = this.playMoveUseCase.execute({
      session: this.session,
      board: this.board,
      arrow,
    });

    if (result.success && result.outcome === 'destroyed') {
      this.arrowsById.delete(command.arrowId);
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  /** Ids de celda que ocupa una flecha, en orden de ocupación (cabeza→cola). */
  private chainCellIds(arrow: Arrow): string[] {
    const ids: string[] = [];
    let current: ArrowSegment | null = arrow.head;
    while (current !== null) {
      ids.push(current.getCellId());
      current = current.next;
    }
    return ids;
  }
}
