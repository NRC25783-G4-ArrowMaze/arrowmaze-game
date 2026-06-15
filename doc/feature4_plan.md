# A4 — Detección de finalización de partida

Feature: **Detección de finalización de partida por vaciado del tablero o agotamiento de movimientos**

## Resumen

Implementar `GameSession` como aggregate root que custodia el presupuesto de movimientos (`movesRemaining`) y el veredicto de la partida (`GameStatus`). Crear `PlayMoveUseCase` como orquestador que delega la cinemática a `AdvanceArrowUseCase` y coordina a `GameSession` para decrementar el presupuesto y re-evaluar el status tras cada tick exitoso. La victoria tiene precedencia estricta sobre la derrota (tablero vacío + último movimiento = WON, no LOST).

---

## User Review Required

> [!IMPORTANT]
> **`allowedMoves` no existe en `LevelData`**. La interfaz actual de `LevelData` (`src/application/dtos/LevelData.ts`) no tiene el campo `allowedMoves`. El plan lo **agrega** como campo obligatorio. Esto afecta todos los niveles de test que construyan `LevelData` directamente. Confirma si prefieres que sea opcional (`allowedMoves?: number`) o obligatorio.

> [!IMPORTANT]
> **`PlayMoveUseCase` recibe `Arrow` directo (en memoria)**. Al igual que `AdvanceArrowUseCase`, el orquestador recibe la instancia `Arrow` ya residente en memoria — no busca flechas en repositorio. Si el futuro diseño del controlador requiere un registro de flechas activas, eso queda fuera del alcance de este feature.

> [!WARNING]
> **`GameSession` no es persistida**. No se crea repositorio ni puerto para `GameSession`. La sesión vive exclusivamente en memoria durante la partida activa. Si se requiere persistencia, es feature separado.

---

## Gherkin asociado

`features/a4-game-end-detection.feature` — 10 escenarios cubiertos:

| Bloque | Escenarios |
|:---|:---|
| Bloque 1 — Consumo atómico | Outline (3 examples: advanced/blocked/destroyed) + fallo de pre-condición |
| Bloque 2 — Victoria | Última flecha sale, vaciado en último movimiento (precedencia WON>LOST), evacuación parcial |
| Bloque 3 — Derrota | movesRemaining → 0 con tablero ocupado, bloqueo persistente agota presupuesto |
| Bloque 4 — Invariantes | Sesión WON rechaza movimientos, sesión LOST rechaza movimientos, consumeMove() con counter=0, evaluateStatus idempotente |

---

## Proposed Changes

### Capa de Dominio — Errores

#### [MODIFY] [ArrowErrors.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/errors/ArrowErrors.ts)

**No se toca.** Los errores de sesión van en un archivo separado.

#### [NEW] `src/domain/errors/GameErrors.ts`

```typescript
/**
 * NoMovesRemainingError — lanzado por GameSession.consumeMove()
 * cuando el contador ya está en cero.
 */
export class NoMovesRemainingError extends Error {
  constructor() {
    super('NoMovesRemainingError: no moves remaining in this session');
    this.name = 'NoMovesRemainingError';
  }
}

/**
 * GameAlreadyFinishedError — lanzado por PlayMoveUseCase
 * cuando se intenta mover en una sesión ya terminal (WON o LOST).
 */
export class GameAlreadyFinishedError extends Error {
  constructor(status: 'WON' | 'LOST') {
    super(`Game already ${status}`);
    this.name = 'GameAlreadyFinishedError';
  }
}
```

---

### Capa de Dominio — Entidades

#### [NEW] `src/domain/entities/GameSession.ts`

Aggregate root. Custodio del presupuesto y del veredicto. **No conoce** `Arrow` ni `AdvanceArrowUseCase`.

```typescript
import type { Board } from './Board';
import { NoMovesRemainingError } from '../errors/GameErrors';

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export class GameSession {
  private _movesRemaining: number;
  private _status: GameStatus;

  constructor(movesRemaining: number) {
    // Precondición: movesRemaining >= 0
    // Lanza Error si movesRemaining < 0
    this._movesRemaining = movesRemaining;
    this._status = 'IN_PROGRESS';
  }

  get movesRemaining(): number { return this._movesRemaining; }
  get status(): GameStatus { return this._status; }

  /**
   * Decrementa el presupuesto en 1.
   * Lanza NoMovesRemainingError si movesRemaining === 0.
   * Invariante: nunca < 0.
   */
  consumeMove(): void { ... }

  /**
   * Inspecciona el tablero pasivo y resuelve el veredicto.
   * - WON si todas las celdas tienen hasArrowSegment() === false.
   * - LOST si movesRemaining === 0 y hay al menos 1 celda ocupada.
   * - IN_PROGRESS en otro caso.
   * Idempotente sobre estados terminales (WON / LOST no cambian).
   */
  evaluateStatus(board: Board): GameStatus { ... }
}
```

**Invariante de evaluación:**
- Si `_status !== 'IN_PROGRESS'` → retorna `_status` inmediatamente (idempotencia).
- Victoria (board vacío) tiene precedencia estricta sobre derrota (movesRemaining=0).
- Solo se llama desde `PlayMoveUseCase` tras `consumeMove()`.

---

### Capa de Aplicación — DTOs

#### [MODIFY] [LevelData.ts](file:///home/jr_g/Develop/arrowmaze-game/src/application/dtos/LevelData.ts)

Agregar `allowedMoves` a la interfaz `LevelData`:

```typescript
export interface LevelData {
  id: string;
  name: string;
  difficulty: string;
  allowedMoves: number;   // ← NUEVO — presupuesto de movimientos del nivel
  cells: CellData[];
  connections: ConnectionData[];
}
```

#### [NEW] `src/application/dtos/SessionDTOs.ts`

```typescript
import type { GameStatus } from '../../domain/entities/GameSession';

/**
 * Input DTO para PlayMoveUseCase.
 */
export interface PlayMoveInput {
  /** La sesión activa de la partida. */
  session: import('../../domain/entities/GameSession').GameSession;
  /** El tablero pasivo (para evaluateStatus). */
  board: import('../../domain/entities/Board').Board;
  /** La flecha que se va a mover. */
  arrow: import('../../domain/entities/Arrow').Arrow;
}

/**
 * Output DTO de PlayMoveUseCase.
 * Extiende el resultado cinemático con el estado de la sesión.
 */
export interface PlayMoveResult {
  success: boolean;
  /** El outcome cinemático (advanced | blocked | destroyed). Presente si success=true. */
  outcome?: 'advanced' | 'blocked' | 'destroyed';
  /** Movimientos restantes tras el tick. */
  movesRemaining: number;
  /** Veredicto de la partida tras el tick. */
  gameStatus: GameStatus;
  /** Mensaje de error. Presente si success=false. */
  error?: string;
}
```

> [!NOTE]
> `PlayMoveInput` importa tipos de dominio directamente (Arrow, Board, GameSession). Esto es válido en la capa de aplicación: application → domain está permitido por la Regla de Dependencia.

---

### Capa de Aplicación — Use Cases

#### [NEW] `src/application/use-cases/PlayMoveUseCase.ts`

```typescript
import { AdvanceArrowUseCase } from './AdvanceArrowUseCase';
import { GameAlreadyFinishedError } from '../../domain/errors/GameErrors';
import type { PlayMoveInput, PlayMoveResult } from '../dtos/SessionDTOs';

export class PlayMoveUseCase {
  private readonly advanceUseCase: AdvanceArrowUseCase;

  constructor(advanceUseCase: AdvanceArrowUseCase) {
    this.advanceUseCase = advanceUseCase;
  }

  execute(input: PlayMoveInput): PlayMoveResult { ... }
}
```

**Algoritmo de orquestación (orden estricto):**
1. **Guard terminal**: si `session.status !== 'IN_PROGRESS'` → lanza `GameAlreadyFinishedError(session.status)` → retorna `{ success: false, error: ..., movesRemaining: session.movesRemaining, gameStatus: session.status }`.
2. **Delegar cinemática**: `const advanceResult = advanceUseCase.execute({ board, arrow })`.
3. **Guard fallo de infra**: si `advanceResult.success === false` → retorna `{ success: false, error: ..., movesRemaining: session.movesRemaining, gameStatus: 'IN_PROGRESS' }`. **No consume movimiento**.
4. **Consumir movimiento**: `session.consumeMove()`.
5. **Re-evaluar status**: `session.evaluateStatus(board)`.
6. **Retornar**: `{ success: true, outcome: advanceResult.outcome, movesRemaining: session.movesRemaining, gameStatus: session.status }`.

---

### Tests

#### [NEW] `__tests__/domain/GameSession.spec.ts`

Tests unitarios puros (objetos reales, sin mocks). Cubre todos los escenarios de Bloque 1 (consumo), Bloque 2 (victoria), Bloque 3 (derrota), Bloque 4 (invariantes).

**Casos `it(...)` enumerados:**

```
describe('GameSession — constructor')
  it('inicializa con movesRemaining = N y status = IN_PROGRESS')
  it('lanza Error si movesRemaining es negativo')

describe('GameSession — consumeMove()')
  it('decrementa movesRemaining en exactamente 1')
  it('lanza NoMovesRemainingError si movesRemaining === 0')
  it('invariante: movesRemaining nunca queda en negativo')

describe('GameSession — evaluateStatus(board)')
  it('retorna WON cuando todas las celdas tienen hasArrowSegment()===false')
  it('retorna LOST cuando movesRemaining===0 y al menos 1 celda ocupada')
  it('retorna IN_PROGRESS cuando hay celdas ocupadas y movesRemaining > 0')
  it('WON tiene precedencia sobre LOST: tablero vacío + movesRemaining=0 → WON')
  it('es idempotente: status WON no cambia con evaluateStatus repetido')
  it('es idempotente: status LOST no cambia con evaluateStatus repetido')
  it('status terminal (WON) no regresa a IN_PROGRESS con tablero ocupado')
```

**Helper de board:**
```typescript
function buildBoardWithCells(occupied: number, free: number): Board
// Construye un Board con `occupied` celdas marcadas con placeArrowSegment()
// y `free` celdas libres. Celdas sin conexiones (todas son exits).
```

#### [NEW] `__tests__/application/PlayMoveUseCase.spec.ts`

Tests de integración del use case. Usa objetos reales del dominio (Board, Cell, Arrow, GameSession) y una instancia real de `AdvanceArrowUseCase`. **Sin mocks.**

**Casos `it(...)` enumerados:**

```
describe('PlayMoveUseCase — consumo atómico')
  it('Scenario Outline [advanced]: ejecución exitosa decrementa 1 movimiento')
  it('Scenario Outline [blocked]:  ejecución bloqueada decrementa 1 movimiento')
  it('Scenario Outline [destroyed]: destrucción decrementa 1 movimiento')
  it('Fallo de pre-condición (advanceResult.success=false) NO consume movimiento')

describe('PlayMoveUseCase — detección de victoria')
  it('última flecha sale del tablero: gameStatus transiciona a WON')
  it('tablero vacío + movesRemaining llega a 0: gameStatus = WON (precedencia WON > LOST)')
  it('evacuación parcial (2 de 3 flechas): gameStatus permanece IN_PROGRESS')

describe('PlayMoveUseCase — detección de derrota')
  it('movesRemaining llega a 0 con tablero ocupado: gameStatus transiciona a LOST')
  it('bloqueo persistente: tick 1 → IN_PROGRESS, tick 2 → LOST')

describe('PlayMoveUseCase — terminalidad')
  it('sesión WON: retorna success=false con error "Game already WON", no invoca AdvanceArrowUseCase')
  it('sesión LOST: retorna success=false con error "Game already LOST", no invoca AdvanceArrowUseCase')
```

> [!NOTE]
> Para verificar que `AdvanceArrowUseCase` **no es invocado** en sesiones terminales, el test coloca la flecha en una posición donde avanzaría (tablero libre) pero verifica que el board/arrow no mutaron — esto confirma que el guard funcionó sin necesitar mocks.

---

### Archivos que NO se tocan

- `src/domain/entities/Arrow.ts`
- `src/domain/entities/Board.ts`
- `src/domain/entities/Cell.ts`
- `src/domain/entities/Head.ts`
- `src/domain/entities/Segment.ts`
- `src/domain/entities/ArrowSegment.ts`
- `src/domain/errors/ArrowErrors.ts`
- `src/domain/value-objects/AdvanceResult.ts`
- `src/domain/value-objects/Port.ts`
- `src/domain/services/TopologyValidator.ts`
- `src/domain/services/TopologyQueryService.ts`
- `src/domain/services/PathChecker.ts`
- `src/application/dtos/ArrowDTOs.ts`
- `src/application/dtos/GameDTOs.ts`
- `src/application/dtos/MovementDTOs.ts`
- `src/application/use-cases/AdvanceArrowUseCase.ts`
- `src/application/use-cases/BuildBoardUseCase.ts`
- `src/application/use-cases/LoadLevelUseCase.ts`
- `src/application/use-cases/PlaceArrowUseCase.ts`
- `src/application/use-cases/QueryTopologyUseCase.ts`
- `src/application/ports/IBoardBuilder.ts`
- `src/application/ports/IBoardRepository.ts`
- `src/application/ports/ILevelRepository.ts`
- `src/infrastructure/factories/BoardFactory.ts`
- `src/infrastructure/repositories/`
- `src/infrastructure/config/`
- Todos los tests existentes (`*.spec.ts` ya creados)

---

## Orden de Implementación (TDD estricto)

| Paso | Archivo | Justificación | Criterio de verificación |
|:---|:---|:---|:---|
| **1** | `src/domain/errors/GameErrors.ts` | Base: errores usados por GameSession y PlayMoveUseCase | Compilación correcta |
| **2** | `src/domain/entities/GameSession.ts` | Core del aggregate root — define el contrato | — |
| **3** | `__tests__/domain/GameSession.spec.ts` | **Tests primero** (TDD Red phase) | `pnpm test` falla en todos los casos |
| **4** | Implementar `GameSession` (código mínimo) | Green phase: hacer pasar los tests del paso 3 | `pnpm test GameSession.spec` pasa |
| **5** | `src/application/dtos/LevelData.ts` — agregar `allowedMoves` | Contrato de datos para el nivel | Compilación correcta |
| **6** | `src/application/dtos/SessionDTOs.ts` | DTOs de entrada/salida de PlayMoveUseCase | Compilación correcta |
| **7** | `__tests__/application/PlayMoveUseCase.spec.ts` | **Tests primero** (TDD Red phase) | `pnpm test` falla en todos los casos |
| **8** | `src/application/use-cases/PlayMoveUseCase.ts` | Green phase: hacer pasar tests del paso 7 | `pnpm test PlayMoveUseCase.spec` pasa |
| **9** | `pnpm test` completo | Regresión: todos los tests previos siguen pasando | Sin fallos |
| **10** | `pnpm lint` | Sin errores de linting | Sin errores |
| **11** | `pnpm gen-uml` | Actualizar diagrama de clases | `classes.puml` actualizado |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| `allowedMoves` en `LevelData` rompe tests existentes de `LoadLevelUseCase` | Verificar tests de `LoadLevel.spec.ts` y `BuildBoard.spec.ts` — si construyen `LevelData` directamente, agregar el campo. Si usan mocks, no hay impacto. |
| `evaluateStatus` invoca `board.getAllCells()` que devuelve `Cell[]` — verificar que `hasArrowSegment()` existe | `Cell.hasArrowSegment()` ya existe (línea 156 de Cell.ts). ✅ |
| Precedencia WON > LOST cuando `movesRemaining=0` y `board` vacío al mismo tiempo | El orden de checks en `evaluateStatus` es crítico: verificar board vacío **primero**, antes de verificar `movesRemaining=0`. Tests lo verifican explícitamente. |
| `PlayMoveUseCase` en sesión terminal invoca `AdvanceArrowUseCase` por error | Guard en paso 1 del algoritmo con `GameAlreadyFinishedError`. Tests de terminalidad lo verifican observando ausencia de mutación en board/arrow. |
| `consumeMove()` en una sesión ya terminal (WON/LOST) | `consumeMove()` es una operación pura de contador — no verifica `_status`. El guard de terminalidad está en `PlayMoveUseCase`, no en `GameSession`. Si se llama directo con counter=0 lanza `NoMovesRemainingError`. |

---

## Criterios de Completitud

```
[ ] Todos los escenarios del feature spec a4-game-end-detection.feature pasan como tests
[ ] pnpm test pasa sin errores (incluye tests existentes sin modificación)
[ ] pnpm lint sin errores
[ ] pnpm gen-uml ejecutado (classes.puml actualizado)
[ ] GameSession: movesRemaining nunca < 0 (invariante verificada por test)
[ ] Precedencia WON > LOST verificada por test explícito
[ ] Sesiones terminales rechazan movimientos (verificado por test)
[ ] evaluateStatus idempotente (verificado por test)
[ ] Separación de capas respetada (GameSession en domain, PlayMoveUseCase en application)
[ ] Sin any injustificado, strict mode respetado
[ ] Archivos fuera del alcance intactos
[ ] Entradas .ai-usage/ generadas (planning + implementation)
```

---

## Verificación Plan (checklist pre-handoff)

```
[x] ¿Puede Haiku ejecutar cada paso sin tomar ninguna decisión de diseño?
    → Sí. Firmas completas, orden de checks explícito, imports indicados.
[x] ¿Cada paso tiene un criterio de verificación?
    → Sí. pnpm test por suite + pnpm test completo al final.
[x] ¿El orden respeta TDD (test → código → refactor)?
    → Sí. Pasos 3-4 (domain tests → domain impl) y 7-8 (app tests → app impl).
[x] ¿El orden respeta capas (errors → entities → DTOs → use case)?
    → Sí. GameErrors (1) → GameSession (2-4) → DTOs (5-6) → PlayMoveUseCase (7-8).
[x] ¿La lista de archivos prohibidos es explícita?
    → Sí. Sección "Archivos que NO se tocan" es exhaustiva.
```
