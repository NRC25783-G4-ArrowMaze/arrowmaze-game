# A5 — Cálculo y composición de la puntuación por sesión de juego

Feature: **game-session-scoring**

## Resumen

Implementar el sistema de scoring como capa de Value Objects compuesta dentro del aggregate `GameSession`. Un `ScoringTracker` acumula contadores en streaming (ticksUsed, fallas, racha consecutiva, penalización acumulada) y un `Score` inmutable se computa al transicionar a WON. La fórmula combina tiempo (positivo), penalización por fallas consecutivas (negativo), y bonus por victoria perfecta. `PlayMoveUseCase` se extiende para notificar el outcome de cada movimiento a `GameSession`, que actualiza sus contadores internos. El score final se expone en `PlayMoveResult` cuando `gameStatus === 'WON'`.

---

## User Review Required

> [!IMPORTANT]
> **Modificación de `PlayMoveUseCase`**. Se inserta `session.recordMoveOutcome(...)` entre `consumeMove()` (paso 4) y `evaluateStatus()` (paso 5). Esto añade un nuevo paso al algoritmo de orquestación existente. Los tests existentes de `PlayMoveUseCase.spec.ts` **no se modifican** y deben seguir pasando — el nuevo campo `score` en `PlayMoveResult` es opcional y los tests existentes no lo verifican.

> [!IMPORTANT]
> **Modificación de `GameSession`**. Se añaden propiedades privadas `_scoringTracker` y `_score`, nuevos getters y un método `recordMoveOutcome()`. El constructor inicializa `ScoringTracker` internamente (sin nuevos parámetros). Los tests existentes de `GameSession.spec.ts` **no se modifican**.

> [!WARNING]
> **`ScoringTracker` como VO mutable internamente**. Aunque se describe como "Value Object", `ScoringTracker` tiene estado interno mutable (contadores). Es más precisamente un "internal component" del aggregate. Se mantiene la nomenclatura VO por consistencia con el spec, pero la semántica real es de objeto interno del aggregate con mutación controlada. `Score` sí es un VO inmutable puro.

---

## Open Questions

Ninguna — todas las preguntas fueron respondidas en la fase anterior.

---

## Proposed Changes

### Capa de Dominio — Value Objects

---

#### [NEW] `src/domain/value-objects/ScoringConstants.ts`

Objeto congelado con las constantes de la fórmula de scoring. Agnóstico a tecnología, reemplazable por un servicio de políticas en el futuro.

```typescript
export const SCORING_CONSTANTS = Object.freeze({
  /** Puntuación base de la que se descuenta el tiempo. */
  BASE: 1000,
  /** Puntos descontados por cada tick usado. */
  DECAY: 2,
  /** Penalización base por cada falla; se multiplica por la posición en la racha. */
  BASE_PENALTY: 10,
  /** Bonus otorgado si el jugador gana sin ninguna falla. */
  FLAWLESS_BONUS: 500,
});
```

---

#### [NEW] `src/domain/value-objects/ScoringTracker.ts`

Componente interno del aggregate `GameSession`. Acumula contadores en streaming durante la partida. **No exporta contadores directamente a capas externas** — la consulta de datos pasa siempre por `GameSession.score` (que es `null` hasta WON).

```typescript
import { SCORING_CONSTANTS } from './ScoringConstants';

export class ScoringTracker {
  private _ticksUsed: number;
  private _totalFails: number;
  private _consecutiveFails: number;
  private _accumulatedPenalty: number;

  constructor() {
    this._ticksUsed = 0;
    this._totalFails = 0;
    this._consecutiveFails = 0;
    this._accumulatedPenalty = 0;
  }

  get ticksUsed(): number { return this._ticksUsed; }
  get totalFails(): number { return this._totalFails; }
  get consecutiveFails(): number { return this._consecutiveFails; }
  get accumulatedPenalty(): number { return this._accumulatedPenalty; }

  /**
   * Registra que un tick (movimiento del jugador) fue procesado.
   * Se invoca 1:1 con cada ejecución exitosa del use case.
   */
  recordTick(): void {
    this._ticksUsed += 1;
  }

  /**
   * Registra un movimiento exitoso (outcome !== 'blocked').
   * Resetea la racha de fallas consecutivas a 0.
   */
  recordSuccess(): void {
    this._consecutiveFails = 0;
  }

  /**
   * Registra una falla (outcome === 'blocked').
   * Incrementa la racha, totalFails, y acumula penalización lineal.
   * Penalización del fallo N en racha = BASE_PENALTY × N.
   */
  recordFailure(): void {
    this._consecutiveFails += 1;
    this._totalFails += 1;
    this._accumulatedPenalty +=
      SCORING_CONSTANTS.BASE_PENALTY * this._consecutiveFails;
  }
}
```

---

#### [NEW] `src/domain/value-objects/Score.ts`

Value Object inmutable. Resultado final del cálculo de scoring. Se computa una única vez cuando `GameSession` transiciona a WON.

```typescript
import type { ScoringTracker } from './ScoringTracker';
import { SCORING_CONSTANTS } from './ScoringConstants';

export class Score {
  readonly timeScore: number;
  readonly penaltyTotal: number;
  readonly flawlessVictory: boolean;
  readonly finalScore: number;

  private constructor(
    timeScore: number,
    penaltyTotal: number,
    flawlessVictory: boolean,
    finalScore: number,
  ) {
    this.timeScore = timeScore;
    this.penaltyTotal = penaltyTotal;
    this.flawlessVictory = flawlessVictory;
    this.finalScore = finalScore;
  }

  /**
   * Factory estático. Computa el Score a partir del estado del tracker.
   * Fórmula:
   *   timeScore  = max(0, BASE − ticksUsed × DECAY)
   *   finalScore = max(0, timeScore − accumulatedPenalty
   *                       + (flawlessVictory ? FLAWLESS_BONUS : 0))
   */
  static compute(tracker: ScoringTracker): Score {
    const timeScore = Math.max(
      0,
      SCORING_CONSTANTS.BASE - tracker.ticksUsed * SCORING_CONSTANTS.DECAY,
    );
    const flawlessVictory = tracker.totalFails === 0;
    const finalScore = Math.max(
      0,
      timeScore
        - tracker.accumulatedPenalty
        + (flawlessVictory ? SCORING_CONSTANTS.FLAWLESS_BONUS : 0),
    );
    return new Score(timeScore, tracker.accumulatedPenalty, flawlessVictory, finalScore);
  }
}
```

---

### Capa de Dominio — Entidades

---

#### [MODIFY] [GameSession.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/GameSession.ts)

Cambios:
1. Componer `ScoringTracker` como propiedad privada (inicializado en constructor, sin nuevos parámetros).
2. Añadir propiedad privada `_score: Score | null` (inicializada a `null`).
3. Exponer getter `score: Score | null`.
4. Añadir método `recordMoveOutcome(moveSucceeded: boolean): void`.
5. En `evaluateStatus()`, al transicionar a WON, computar `Score.compute(this._scoringTracker)`.

**Lo que NO cambia:**
- Firma del constructor (`movesRemaining: number`).
- Firma de `consumeMove()`.
- Firma de `evaluateStatus(board: Board): GameStatus`.
- Comportamiento existente de `movesRemaining`, `status`, `consumeMove()`, `evaluateStatus()`.

```typescript
import type { Board } from './Board';
import { NoMovesRemainingError } from '../errors/GameErrors';
import { ScoringTracker } from '../value-objects/ScoringTracker';
import { Score } from '../value-objects/Score';

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export class GameSession {
  private _movesRemaining: number;
  private _status: GameStatus;
  private readonly _scoringTracker: ScoringTracker;
  private _score: Score | null;

  constructor(movesRemaining: number) {
    if (movesRemaining < 0) {
      throw new Error('GameSession: movesRemaining must be >= 0');
    }
    this._movesRemaining = movesRemaining;
    this._status = 'IN_PROGRESS';
    this._scoringTracker = new ScoringTracker();
    this._score = null;
  }

  get movesRemaining(): number { return this._movesRemaining; }
  get status(): GameStatus { return this._status; }
  get score(): Score | null { return this._score; }

  consumeMove(): void {
    if (this._movesRemaining === 0) {
      throw new NoMovesRemainingError();
    }
    this._movesRemaining -= 1;
  }

  /**
   * Registra el outcome del movimiento para actualizar contadores de scoring.
   * - moveSucceeded=true  (advanced | destroyed): resetea racha de fallas.
   * - moveSucceeded=false (blocked):             incrementa racha y penalización.
   * Siempre incrementa ticksUsed en 1.
   */
  recordMoveOutcome(moveSucceeded: boolean): void {
    this._scoringTracker.recordTick();
    if (moveSucceeded) {
      this._scoringTracker.recordSuccess();
    } else {
      this._scoringTracker.recordFailure();
    }
  }

  evaluateStatus(board: Board): GameStatus {
    if (this._status !== 'IN_PROGRESS') {
      return this._status;
    }

    const allEmpty = board.getAllCells().every(cell => !cell.hasArrowSegment());
    if (allEmpty) {
      this._status = 'WON';
      this._score = Score.compute(this._scoringTracker);
      return this._status;
    }

    if (this._movesRemaining === 0) {
      this._status = 'LOST';
      return this._status;
    }

    return this._status;
  }
}
```

---

### Capa de Aplicación — DTOs

---

#### [MODIFY] [SessionDTOs.ts](file:///f:/Dev/arrowmaze-game/src/application/dtos/SessionDTOs.ts)

Cambio: añadir campo opcional `score?: number` a `PlayMoveResult`.

```typescript
export interface PlayMoveResult {
  success: boolean;
  outcome?: 'advanced' | 'blocked' | 'destroyed';
  movesRemaining: number;
  gameStatus: GameStatus;
  score?: number;   // ← NUEVO — presente solo cuando gameStatus === 'WON'
  error?: string;
}
```

**Lo que NO cambia:** `PlayMoveInput`.

---

### Capa de Aplicación — Use Cases

---

#### [MODIFY] [PlayMoveUseCase.ts](file:///f:/Dev/arrowmaze-game/src/application/use-cases/PlayMoveUseCase.ts)

Cambios en el algoritmo de orquestación (solo pasos 4.5 y 6):

```
Paso 1  — Guard terminal                        (sin cambio)
Paso 2  — Delegar cinemática                     (sin cambio)
Paso 3  — Guard fallo de infra                   (sin cambio)
Paso 4  — consumeMove()                          (sin cambio)
Paso 4.5— recordMoveOutcome(outcome !== 'blocked') ← NUEVO
Paso 5  — evaluateStatus(board)                  (sin cambio)
Paso 6  — Retornar (añadir score si WON)         ← MODIFICADO
```

Cambios concretos en código:

```typescript
// Después de paso 4 (consumeMove):
// Step 4.5 — Record outcome for scoring
session.recordMoveOutcome(advanceResult.outcome !== 'blocked');

// Step 5 — Re-evaluate status (sin cambio)
session.evaluateStatus(board);

// Step 6 — Return (modificado)
return {
  success: true,
  outcome: advanceResult.outcome,
  movesRemaining: session.movesRemaining,
  gameStatus: session.status,
  ...(session.score !== null ? { score: session.score.finalScore } : {}),
};
```

---

### Tests

---

#### [NEW] `__tests__/domain/ScoringTracker.spec.ts`

Tests unitarios puros para la mecánica de contadores del tracker. Sin mocks.

```
describe('ScoringTracker — constructor')
  it('inicializa todos los contadores en 0')

describe('ScoringTracker — recordTick')
  it('incrementa ticksUsed en 1')
  it('múltiples ticks: ticksUsed refleja la cuenta total')

describe('ScoringTracker — recordFailure')
  it('incrementa consecutiveFails, totalFails y accumulatedPenalty')
  it('penalización del fallo N en racha = BASE_PENALTY × N')
  it('múltiples fallas consecutivas acumulan penalización lineal creciente')

describe('ScoringTracker — recordSuccess')
  it('resetea consecutiveFails a 0')
  it('no modifica totalFails ni accumulatedPenalty')

describe('ScoringTracker — secuencias de eventos')
  it('falla-éxito-falla-éxito-falla: 3 rachas de 1 → penalty = 30')
  it('falla-falla-éxito-falla-falla: dos rachas (1,2)(1,2) → penalty = 60')

describe('ScoringTracker — validación paramétrica racha consecutiva')
  it.each([
    { fallas: 1,  penalizacion: 10,   },
    { fallas: 2,  penalizacion: 30,   },
    { fallas: 3,  penalizacion: 60,   },
    { fallas: 4,  penalizacion: 100,  },
    { fallas: 5,  penalizacion: 150,  },
    { fallas: 6,  penalizacion: 210,  },
    { fallas: 10, penalizacion: 550,  },
    { fallas: 12, penalizacion: 780,  },
    { fallas: 13, penalizacion: 910,  },
    { fallas: 20, penalizacion: 2100, },
  ])('racha de $fallas fallas → penalización acumulada = $penalizacion')
```

---

#### [NEW] `__tests__/domain/Score.spec.ts`

Tests unitarios puros para el cómputo de la fórmula final. Usa `ScoringTracker` real (sin mocks) para construir el estado y luego invoca `Score.compute()`.

```
describe('Score — compute: componente tiempo + flawless')
  it('ticksUsed=100, 0 fails → timeScore=800, flawless=true, finalScore=1300')
  it('ticksUsed=600, 0 fails → timeScore clamped a 0, flawless=true, finalScore=500')
  it('ticksUsed=0, 0 fails → timeScore=1000, flawless=true, finalScore=1500')

describe('Score — compute: penalización por fallas')
  it('ticksUsed=100, 1 falla aislada (penalty=10) → flawless=false, finalScore=790')
  it('ticksUsed=100, 3 fallas consecutivas (penalty=60) → finalScore=740')
  it('ticksUsed=100, 20 fallas consecutivas → finalScore clamped a 0')

describe('Score — compute: flawlessVictory flag')
  it('totalFails=0 → flawlessVictory=true')
  it('totalFails>0 → flawlessVictory=false')

describe('Score — immutability')
  it('properties timeScore, penaltyTotal, flawlessVictory, finalScore son readonly')
```

---

#### [NEW] `__tests__/domain/GameSessionScoring.spec.ts`

Tests de integración del scoring dentro del aggregate `GameSession`. Usa objetos reales (Board, Cell, GameSession). **No toca `GameSession.spec.ts` existente.**

**Helper reutilizado:**
```typescript
function buildEmptyBoard(): Board {
  const board = new Board('test-board');
  const cell = new Cell('free-1', 2);
  board.addCell(cell);
  return board;
}
```

```
describe('GameSession — scoring: Grupo 1 — tiempo + flawless')
  it('victoria sin fallas con ticksUsed=100: score.finalScore = 1300')
  it('timeScore clamped: ticksUsed=600, score.finalScore = 500')

describe('GameSession — scoring: Grupo 2 — penalización por fallas')
  it('1 falla aislada: flawlessVictory=false, score.finalScore = 790')
  it('3 fallas no consecutivas (racha=1 cada una): score.finalScore = 770')
  it('3 fallas consecutivas: score.finalScore = 740')
  it('éxito intermedio resetea racha: falla-falla-éxito-falla-falla → score.finalScore = 740')
  it('20 fallas consecutivas: score.finalScore clamped a 0')

describe('GameSession — scoring: Grupo 3 — estados terminales')
  it('LOST → score = null')
  it('IN_PROGRESS → score = null')
  it('consultar score en LOST no expone contadores internos')
  it('consultar score en IN_PROGRESS no expone contadores internos')

describe('GameSession — scoring: Grupo 4 — componentes descartados')
  it('arrowsEvacuated no afecta el score: dos sesiones con distinto nº de flechas evacuadas producen mismo score')
  it('movesRemaining no afecta el score: dos sesiones con distinto movesRemaining producen mismo score')

describe('GameSession — scoring: Grupo 5 — validación paramétrica')
  it.each([
    { fallas: 1,  penalizacion: 10,   score: 790  },
    { fallas: 2,  penalizacion: 30,   score: 770  },
    { fallas: 3,  penalizacion: 60,   score: 740  },
    { fallas: 4,  penalizacion: 100,  score: 700  },
    { fallas: 5,  penalizacion: 150,  score: 650  },
    { fallas: 6,  penalizacion: 210,  score: 590  },
    { fallas: 10, penalizacion: 550,  score: 250  },
    { fallas: 12, penalizacion: 780,  score: 20   },
    { fallas: 13, penalizacion: 910,  score: 0    },
    { fallas: 20, penalizacion: 2100, score: 0    },
  ])('racha de $fallas fallas consecutivas → penalización=$penalizacion, score=$score')
```

---

#### [NEW] `__tests__/application/PlayMoveScoring.spec.ts`

Tests de integración del scoring a través del orquestador `PlayMoveUseCase`. Usa objetos reales del dominio. **No toca `PlayMoveUseCase.spec.ts` existente.**

**Helpers:** reutiliza el patrón `buildLinearBoard()` y `makeUseCase()` del spec existente (copiarlos, no importarlos).

```
describe('PlayMoveUseCase — scoring: score en PlayMoveResult')
  it('victoria con 0 fallas: PlayMoveResult.score = 1300 (ticksUsed=1 → timeScore=998, + 500 flawless)')
  it('victoria con fallas: PlayMoveResult.score refleja penalizaciones')
  it('IN_PROGRESS: PlayMoveResult.score es undefined')
  it('LOST: PlayMoveResult.score es undefined')

describe('PlayMoveUseCase — scoring: registro de outcomes')
  it('outcome=blocked registra falla: consecutiveFails incrementa')
  it('outcome=advanced registra éxito: consecutiveFails se resetea')
  it('outcome=destroyed registra éxito: consecutiveFails se resetea')

describe('PlayMoveUseCase — scoring: fallo de infra no registra outcome')
  it('advanceResult.success=false: no invoca recordMoveOutcome, scoring intacto')
```

---

## Archivos que NO se tocan

- `src/domain/entities/Arrow.ts`
- `src/domain/entities/Board.ts`
- `src/domain/entities/Cell.ts`
- `src/domain/entities/Head.ts`
- `src/domain/entities/Segment.ts`
- `src/domain/entities/ArrowSegment.ts`
- `src/domain/errors/ArrowErrors.ts`
- `src/domain/errors/GameErrors.ts`
- `src/domain/value-objects/AdvanceResult.ts`
- `src/domain/value-objects/Port.ts`
- `src/domain/services/TopologyValidator.ts`
- `src/domain/services/TopologyQueryService.ts`
- `src/domain/services/PathChecker.ts`
- `src/application/dtos/ArrowDTOs.ts`
- `src/application/dtos/GameDTOs.ts`
- `src/application/dtos/MovementDTOs.ts`
- `src/application/dtos/LevelData.ts`
- `src/application/use-cases/AdvanceArrowUseCase.ts`
- `src/application/use-cases/BuildBoardUseCase.ts`
- `src/application/use-cases/LoadLevelUseCase.ts`
- `src/application/use-cases/PlaceArrowUseCase.ts`
- `src/application/use-cases/QueryTopologyUseCase.ts`
- `src/application/ports/IBoardBuilder.ts`
- `src/application/ports/IBoardRepository.ts`
- `src/application/ports/ILevelRepository.ts`
- `src/infrastructure/` (directorio completo)
- `__tests__/domain/GameSession.spec.ts`
- `__tests__/domain/arrow_movement.spec.ts`
- `__tests__/domain/arrow_placement.spec.ts`
- `__tests__/domain/board_graph.spec.ts`
- `__tests__/application/AdvanceArrowUseCase.spec.ts`
- `__tests__/application/BuildBoardUseCase.spec.ts`
- `__tests__/application/LoadLevelUseCase.spec.ts`
- `__tests__/application/PlaceArrowUseCase.spec.ts`
- `__tests__/application/QueryTopologyUseCase.spec.ts`
- `__tests__/application/PlayMoveUseCase.spec.ts`

---

## Orden de Implementación (TDD estricto)

| Paso | Archivo | Justificación | Criterio de verificación |
|:---|:---|:---|:---|
| **1** | `src/domain/value-objects/ScoringConstants.ts` | Base: constantes usadas por todos los VOs | Compilación correcta |
| **2** | `src/domain/value-objects/ScoringTracker.ts` | Stub mínimo (clase vacía con constructor) | Compilación correcta |
| **3** | `__tests__/domain/ScoringTracker.spec.ts` | **Red phase**: todos los tests fallan | `pnpm test -- --testPathPattern="ScoringTracker"` → todos rojos |
| **4** | Implementar `ScoringTracker` completo | **Green phase** | `pnpm test -- --testPathPattern="ScoringTracker"` → todos verdes |
| **5** | `src/domain/value-objects/Score.ts` | Stub mínimo (clase con constructor privado y compute estático) | Compilación correcta |
| **6** | `__tests__/domain/Score.spec.ts` | **Red phase**: todos los tests fallan | `pnpm test -- --testPathPattern="Score.spec"` → todos rojos |
| **7** | Implementar `Score.compute()` completo | **Green phase** | `pnpm test -- --testPathPattern="Score.spec"` → todos verdes |
| **8** | Modificar `src/domain/entities/GameSession.ts` — añadir ScoringTracker, score, recordMoveOutcome | Integrar VOs en el aggregate | Compilación correcta |
| **9** | `__tests__/domain/GameSessionScoring.spec.ts` | **Red phase**: tests de scoring sobre GameSession | `pnpm test -- --testPathPattern="GameSessionScoring"` → todos rojos |
| **10** | Completar `evaluateStatus()` con Score.compute() al transicionar a WON | **Green phase** | `pnpm test -- --testPathPattern="GameSessionScoring"` → todos verdes |
| **11** | Modificar `src/application/dtos/SessionDTOs.ts` — añadir `score?: number` | Contrato DTO actualizado | Compilación correcta |
| **12** | `__tests__/application/PlayMoveScoring.spec.ts` | **Red phase**: tests del orquestador | `pnpm test -- --testPathPattern="PlayMoveScoring"` → todos rojos |
| **13** | Modificar `src/application/use-cases/PlayMoveUseCase.ts` — paso 4.5 + score en retorno | **Green phase** | `pnpm test -- --testPathPattern="PlayMoveScoring"` → todos verdes |
| **14** | `pnpm test` completo | Regresión: todos los tests previos pasan | Sin fallos |
| **15** | `pnpm lint` | Sin errores de linting | Sin errores |
| **16** | `pnpm gen-uml` | Actualizar diagrama de clases | `classes.puml` actualizado |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| `GameSession` constructor sin nuevos parámetros: tests existentes crean `new GameSession(N)` | ✅ `ScoringTracker` se crea internamente. Constructor sigue recibiendo solo `movesRemaining`. Tests existentes pasan sin cambios. |
| `PlayMoveResult` con nuevo campo `score?`: tests existentes verifican campos | ✅ `score` es opcional. Tests existentes no lo verifican → sin impacto. |
| `PlayMoveUseCase` con nuevo paso `recordMoveOutcome`: altera la secuencia | El nuevo paso ocurre después de `consumeMove()` y antes de `evaluateStatus()`. No afecta el outcome cinemático ni el consumo de movimientos. Tests existentes pasan. |
| `ScoringTracker` importado por `GameSession` cruza VOs→Entities dentro de domain | ✅ Ambos en la capa domain. La regla de dependencia es entre capas, no dentro de la misma capa. |
| Contadores expuestos vía `ScoringTracker` getters: riesgo de fuga de datos internos | `GameSession` no expone `_scoringTracker`. Solo expone `score: Score \| null`. Gherkin Grupo 3 lo verifica explícitamente. |
| `evaluateStatus` llamado sin `recordMoveOutcome` previo (uso directo en tests existentes) | Los tests existentes llaman `evaluateStatus` directamente. El tracker tendrá ticksUsed=0 y totalFails=0, produciendo score válido si transiciona a WON. Esto es correcto: sin movimientos registrados = score máximo + flawless. No rompe nada. |

---

## Criterios de Completitud

```
[ ] ScoringConstants congelado con BASE=1000, DECAY=2, BASE_PENALTY=10, FLAWLESS_BONUS=500
[ ] ScoringTracker acumula ticksUsed, totalFails, consecutiveFails, accumulatedPenalty
[ ] Score.compute() implementa la fórmula consolidada con clamps
[ ] GameSession compone ScoringTracker y expone score: Score | null
[ ] GameSession.recordMoveOutcome() actualiza contadores del tracker
[ ] Score se computa al transicionar a WON; null en LOST/IN_PROGRESS
[ ] PlayMoveUseCase llama recordMoveOutcome entre consumeMove y evaluateStatus
[ ] PlayMoveResult incluye score cuando gameStatus === 'WON'
[ ] Todos los escenarios Gherkin (Grupos 1-5) cubiertos por tests
[ ] pnpm test pasa sin errores (incluye tests existentes sin modificación)
[ ] pnpm lint sin errores
[ ] pnpm gen-uml ejecutado (classes.puml actualizado)
[ ] Separación de capas respetada (VOs y Entity en domain, DTOs y UC en application)
[ ] Sin any, sin secrets hardcodeados
[ ] Archivos fuera del alcance intactos
[ ] Entradas .ai-usage/ generadas (planning + implementation)
```

---

## Verificación Plan (checklist pre-handoff)

```
[x] ¿Puede Haiku ejecutar cada paso sin tomar ninguna decisión de diseño?
    → Sí. Firmas completas, fórmula explícita, imports indicados, orden de checks especificado.
[x] ¿Cada paso tiene un criterio de verificación?
    → Sí. pnpm test por suite + pnpm test completo al final.
[x] ¿El orden respeta TDD (test → código → refactor)?
    → Sí. Pasos 3-4 (tracker tests → impl), 6-7 (score tests → impl), 9-10 (session tests → impl), 12-13 (UC tests → impl).
[x] ¿El orden respeta capas (constants → VOs → entities → DTOs → use case)?
    → Sí. ScoringConstants (1) → ScoringTracker (2-4) → Score (5-7) → GameSession (8-10) → SessionDTOs (11) → PlayMoveUseCase (12-13).
[x] ¿La lista de archivos prohibidos es explícita?
    → Sí. Sección "Archivos que NO se tocan" es exhaustiva (37 archivos/directorios).
```
