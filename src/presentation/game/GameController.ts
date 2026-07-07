import { Board } from '../../domain/entities/Board';
import { Arrow } from '../../domain/entities/Arrow';
import type { ArrowSegment } from '../../domain/entities/ArrowSegment';
import { GameSession, type GameStatus } from '../../domain/entities/GameSession';
import { SlideArrowUseCase } from '../../application/use-cases/SlideArrowUseCase';
import { AdvanceArrowUseCase } from '../../application/use-cases/AdvanceArrowUseCase';
import { LevelLoader } from '../../application/use-cases/LevelLoader';
import { LevelDataBoardBuilder } from '../../application/services/LevelDataBoardBuilder';
import { LevelDataArrowBuilder } from '../../application/services/LevelDataArrowBuilder';
import type { SlideResult } from '../../application/dtos/SlideDTOs';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';
import type { BoardViewModel } from '../viewModel';
import type { PlayMoveCommand } from '../input/PlayMoveCommand';
import { type Scene, type CollisionBehavior, toLevelDataDTO } from './scene';

/** Snapshot mínimo para reconstruir una flecha en su posición de inicio de slide. */
export interface ArrowSnapshot {
  /** Celdas que ocupa la flecha, en orden cabeza→cola. */
  cellIds: string[];
  /** Puerto de salida del head (intención direccional del dominio). */
  exitPort: number;
}

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
  private readonly slideUseCase: SlideArrowUseCase;
  private readonly advanceUseCase: AdvanceArrowUseCase;

  /** Qué hace una flecha al chocar (decisión de presentación, fijada por la escena). */
  private readonly _collisionBehavior: CollisionBehavior;

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
    this._collisionBehavior = scene.collisionBehavior ?? 'return';
    // Misma instancia (stateless) para el slide headless y el avance tick-a-tick.
    this.advanceUseCase = new AdvanceArrowUseCase();
    this.slideUseCase = new SlideArrowUseCase(this.advanceUseCase);

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

  /** Comportamiento de colisión configurado por la escena ('return' por defecto). */
  get collisionBehavior(): CollisionBehavior {
    return this._collisionBehavior;
  }

  // ─────────────────────────────────────────────
  // PROYECCIÓN AL VIEW-MODEL (B1)
  // ─────────────────────────────────────────────

  /** Proyecta el estado vivo actual al view-model que consume BoardComponent. */
  viewModel(): BoardViewModel {
    const cells = Array.from(this.layoutByCellId.entries()).map(
      ([id, { col, row }]) => ({ id, col, row }),
    );

    const arrows = Array.from(this.arrowsById.entries()).map(([id, arrow]) => {
      const cellIds = this.chainCellIds(arrow);
      return {
        id,
        color: this.colorById.get(id) ?? '#000000',
        cellIds,
        exitDir: this.visualExitDir(arrow.head.exitPort, cellIds),
      };
    });

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
  playMove(command: PlayMoveCommand): SlideResult | null {
    const arrow = this.arrowsById.get(command.arrowId);
    if (arrow === undefined) {
      return null;
    }

    const result = this.slideUseCase.execute({
      session: this.session,
      board: this.board,
      arrow,
    });

    if (result.success && result.finalOutcome === 'destroyed') {
      this.arrowsById.delete(command.arrowId);
    }

    return result;
  }

  /**
   * Ejecuta UN tick de avance de la flecha (vía AdvanceArrowUseCase) sin tocar la
   * sesión. Es el paso atómico que la presentación encadena en el tiempo para
   * animar el slide tick-a-tick (la forma real del dominio se reproyecta entre
   * pasos). Si el tick destruye la flecha, se retira del mapa de vivas.
   *
   * NO consume movimiento ni registra scoring: eso lo hace commitSlide() una sola
   * vez al final del slide, preservando la regla "1 click = 1 jugada".
   *
   * @returns El outcome del tick, o null si la flecha no existe o el motor falló.
   */
  advanceTick(arrowId: string): AdvanceOutcome | null {
    const arrow = this.arrowsById.get(arrowId);
    if (arrow === undefined) {
      return null;
    }

    const result = this.advanceUseCase.execute({ board: this.board, arrow });
    if (!result.success) {
      return null;
    }

    if (result.outcome === 'destroyed') {
      this.arrowsById.delete(arrowId);
    }

    return result.outcome;
  }

  /**
   * Consolida un slide como UNA jugada: consume 1 movimiento, registra 1 outcome
   * de scoring y re-evalúa el status una vez. Espeja la consolidación que
   * SlideArrowUseCase hace de golpe, pero para el bucle desplegado en el tiempo.
   */
  commitSlide(finalOutcome: AdvanceOutcome): void {
    this.session.consumeMove();
    this.session.recordMoveOutcome(finalOutcome !== 'blocked');
    this.session.evaluateStatus(this.board);
  }

  // ─────────────────────────────────────────────
  // SNAPSHOT / RESTORE (modo de colisión 'return')
  // ─────────────────────────────────────────────

  /**
   * Captura la posición actual de una flecha (celdas cabeza→cola + exitPort del head)
   * para poder reconstruirla luego. Lo usa el modo 'return' al iniciar un slide.
   *
   * @returns El snapshot, o null si la flecha no existe.
   */
  snapshotArrow(arrowId: string): ArrowSnapshot | null {
    const arrow = this.arrowsById.get(arrowId);
    if (arrow === undefined) {
      return null;
    }
    return { cellIds: this.chainCellIds(arrow), exitPort: arrow.head.exitPort };
  }

  /**
   * Reconstruye una flecha en la posición de un snapshot, reutilizando la API
   * pública del motor (destroy → new Arrow → extend). Lo usa el modo 'return' al
   * terminar el glide de regreso: deja el estado de dominio coherente con lo que se
   * ve (la flecha vuelve a su origen del slide).
   *
   * Precondición: las celdas del snapshot están libres (la flecha las vació al
   * avanzar y el input está bloqueado durante el slide, así que nadie más las ocupó).
   */
  restoreArrow(arrowId: string, snapshot: ArrowSnapshot): void {
    const arrow = this.arrowsById.get(arrowId);
    if (arrow !== undefined) {
      arrow.destroy();
    }

    const headCell = this.board.getCell(snapshot.cellIds[0]);
    if (headCell === undefined) {
      return;
    }

    const restored = new Arrow(headCell, snapshot.exitPort);
    for (let i = 1; i < snapshot.cellIds.length; i++) {
      const cell = this.board.getCell(snapshot.cellIds[i]);
      if (cell === undefined) {
        return;
      }
      restored.extend(cell);
    }

    this.arrowsById.set(arrowId, restored);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  /**
   * Dirección visual de la punta (leading end), derivada de las dos últimas celdas.
   * Para flechas rectas coincide con head.exitPort; para flechas curvadas corrige
   * la discrepancia entre el puerto del head (trailing) y la dirección real del tip.
   */
  private visualExitDir(headExitPort: number, cellIds: string[]): number {
    const lastId = cellIds[cellIds.length - 1];
    const prevId = cellIds[cellIds.length - 2];
    if (prevId === undefined || lastId === undefined) return headExitPort;
    const last = this.layoutByCellId.get(lastId);
    const prev = this.layoutByCellId.get(prevId);
    if (last === undefined || prev === undefined) return headExitPort;
    const dCol = last.col - prev.col;
    const dRow = last.row - prev.row;
    if (dRow === -1) return 0; // North
    if (dCol === 1) return 1;  // East
    if (dRow === 1) return 2;  // South
    if (dCol === -1) return 3; // West
    return headExitPort;
  }

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
