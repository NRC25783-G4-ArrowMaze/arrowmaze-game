# FIX-1 — Deslizamiento de flecha por click (capa de Aplicación)

Feature: **Un click desliza la flecha celda a celda hasta que sale o choca, vía un caso de uso que encadena `advance()`.**

## Resumen

Hoy `PlayMoveUseCase` ejecuta **un tick** (una celda) por invocación. Este fix añade `SlideArrowUseCase` en la **capa de Aplicación**: encadena `AdvanceArrowUseCase` hasta que el outcome deja de ser `advanced` (`blocked` o `destroyed`), consolida el resultado para la sesión y devuelve la **trayectoria de ticks** para que la presentación la anime.

**No toca dominio.** `advance()` sigue siendo atómico (1 tick = 1 celda). El bucle es pura orquestación de aplicación; no reimplementa trayectoria, puertos ni colisión.

> Alcance de este fix: el **caso de uso + tests**. El cableado en presentación (animar la trayectoria al hacer click) es un paso de seguimiento, también sin tocar dominio.

---

## Decisiones confirmadas

> [!IMPORTANT]
> **Presupuesto: 1 click = 1 movimiento — CONFIRMADO ✓ (usuario).** Un slide consume **exactamente 1 movimiento** (un click = una "jugada"), sin importar cuántas celdas recorra. (`PlayMoveUseCase` consume 1 por tick y NO se modifica.)

> [!IMPORTANT]
> **Scoring: 1 slide = 1 registro — CONFIRMADO ✓ (derivado).** `SlideArrowUseCase` llama `session.recordMoveOutcome(...)` **una sola vez** por slide (con el outcome final), no por tick. `ticksUsed` cuenta **clicks**, no celdas. `PlayMoveUseCase` y sus tests de scoring **no se tocan**.

> [!NOTE]
> **Colisión de serpientes depende de FIX-2.** El slide se detiene en `blocked`/`destroyed` que el dominio **ya** detecta: salidas (sumidero) y choques de **cabeza/1-celda**. El choque del **frente (cola)** de una serpiente contra otra flecha NO lo detecta el dominio actual (hueco documentado) → ese caso se cubre en el segundo fix (dominio). Por eso el Bloque 2 del Gherkin usa choques de cabeza.

---

## Gherkin asociado

`features/slide-arrow-movement.feature` — bloques:

| Bloque | Escenarios |
|:---|:---|
| 1 — Deslizar hasta salir | flecha avanza N ticks hasta sumidero → `destroyed`; expone trayectoria |
| 2 — Deslizar hasta chocar | se detiene en `blocked` (choque de cabeza); bloqueo inmediato en tick 1 |
| 3 — Sesión y presupuesto | 1 slide = 1 movimiento; `evaluateStatus` una vez; victoria al vaciar |
| 4 — Frontera de capas | el use case solo delega en `AdvanceArrowUseCase`, no reimplementa reglas |

---

## Proposed Changes

### Capa de Aplicación — DTOs

#### [NEW] `src/application/dtos/SlideDTOs.ts`

```typescript
import type { GameStatus } from '../../domain/entities/GameSession';
import type { Board } from '../../domain/entities/Board';
import type { Arrow } from '../../domain/entities/Arrow';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';

export interface SlideInput {
  session: GameSession;
  board: Board;
  arrow: Arrow;
}

export interface SlideResult {
  success: boolean;
  /** Outcome de cada tick, en orden: ['advanced', ..., 'blocked' | 'destroyed']. */
  trajectory: AdvanceOutcome[];
  /** Outcome del último tick (estado en que se detuvo el slide). */
  finalOutcome?: AdvanceOutcome;
  movesRemaining: number;
  gameStatus: GameStatus;
  score?: number;   // presente solo cuando gameStatus === 'WON'
  error?: string;
}
```

> `GameSession`/`Board`/`Arrow` se importan como tipos de dominio (permitido: application → domain).

### Capa de Aplicación — Use Case

#### [NEW] `src/application/use-cases/SlideArrowUseCase.ts`

Constructor recibe `AdvanceArrowUseCase` (igual que `PlayMoveUseCase`).

**Algoritmo (orden estricto):**
1. **Guard terminal**: si `session.status !== 'IN_PROGRESS'` → `{ success:false, trajectory:[], movesRemaining, gameStatus: status, error }`. Sin ticks.
2. **Bucle de ticks**:
   ```
   trajectory = []
   loop:
     result = advanceUseCase.execute({ board, arrow })
     if !result.success: → fallo de infra, romper SIN consumir movimiento, error
     trajectory.push(result.outcome)
     if result.outcome !== 'advanced': break   // 'blocked' o 'destroyed'
   ```
   (Salvaguarda anti-bucle-infinito: el dominio garantiza terminación —cada tick libera la cola o se bloquea—; aun así se puede acotar a un máximo defensivo = nº de celdas del tablero.)
3. **Consumir 1 movimiento**: `session.consumeMove()` (una vez).
4. **Registrar scoring 1 vez**: `session.recordMoveOutcome(finalOutcome !== 'blocked')`.
5. **Re-evaluar status una vez**: `session.evaluateStatus(board)`.
6. **Retornar**: `{ success:true, trajectory, finalOutcome, movesRemaining, gameStatus, score? }`.

> No modifica `PlayMoveUseCase` (se conserva para el modo tick-a-tick y sus tests).

### Tests

#### [NEW] `__tests__/application/SlideArrowUseCase.spec.ts`

Integración con objetos reales (Board, Cell, Arrow, GameSession) y `AdvanceArrowUseCase` real. Sin mocks. Cubre los 4 bloques del Gherkin:

```
describe('SlideArrowUseCase — deslizar hasta salir')
  it('encadena ticks hasta el sumidero y termina en destroyed')
  it('expone la trayectoria de ticks en orden')

describe('SlideArrowUseCase — deslizar hasta chocar (cabeza)')
  it('se detiene en blocked al topar una flecha ajena')
  it('bloqueo inmediato: blocked en el primer tick sin desplazamiento')

describe('SlideArrowUseCase — sesión y presupuesto')
  it('un slide consume exactamente 1 movimiento (no 1 por tick)')
  it('evaluateStatus se aplica una vez; vaciar el tablero → WON con score')
  it('fallo de infra (advance.success=false) no consume movimiento')

describe('SlideArrowUseCase — terminalidad y capas')
  it('sesión WON/LOST: rechaza el slide sin ejecutar advance()')
```

---

### Archivos que NO se tocan

- **Todo `src/domain/**`** (incl. `Arrow.advance()`).
- `src/application/use-cases/PlayMoveUseCase.ts` y su spec.
- `src/application/use-cases/AdvanceArrowUseCase.ts`.
- DTOs y tests existentes.

---

## Orden de Implementación (TDD)

| Paso | Archivo | Verificación |
|:---|:---|:---|
| 1 | `dtos/SlideDTOs.ts` | compila |
| 2 | `__tests__/application/SlideArrowUseCase.spec.ts` (Red) | falla |
| 3 | `use-cases/SlideArrowUseCase.ts` (Green) | spec pasa |
| 4 | `pnpm test` completo | 216 + nuevos verdes, sin regresión |
| 5 | `pnpm lint` | sin errores |
| 6 | `pnpm gen-uml` | `classes.puml` actualizado |
| 7 | `.ai-usage/` | entrada planning + implementation |

---

## Riesgos

| Riesgo | Mitigación |
|:---|:---|
| Bucle infinito si el dominio no terminara | El dominio garantiza progreso (libera cola o bloquea); cota defensiva = nº de celdas |
| Cambiar scoring rompe tests existentes | `SlideArrowUseCase` es nuevo; `PlayMoveUseCase`/scoring no se tocan |
| Esperar que el slide frene serpientes contra otras flechas | Documentado: depende de FIX-2 (dominio). Bloque 2 usa choque de cabeza |

---

## Relación con FIX-2 (siguiente)

FIX-2 (dominio): validar el destino de la **cola** en `Arrow.advance()` para que el `blocked` también cubra el choque del frente de una serpiente. Una vez en su lugar, el Bloque 2 de este slide cubrirá también serpientes sin cambios en `SlideArrowUseCase`.
