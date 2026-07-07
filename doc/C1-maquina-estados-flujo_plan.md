# C1 — Máquina de estados del flujo de una partida (lo que falta)

Feature: **game-flow-stack** (spec: [`C1-maquina_estados_partida.feature`](../../arrowmaze-project-core/features/C1-maquina_estados_partida.feature))

## Resumen

C1 hoy solo cubre el veredicto de Dominio (`GameStatus: IN_PROGRESS | WON | LOST`, en `GameSession`, ya implementado — A4/A5). Lo que falta es el **flujo de UI** (pausa, ajustes, reiniciar, salir) que C4 necesita para construir sus pantallas. Este plan implementa un **autómata de pila** (Pushdown Automaton) en la capa de **Aplicación**, separado del Dominio: `GameFlowController` mantiene una pila de `GameFlowState` (`ACTIVE | PAUSED | SETTINGS`) que envuelve una `GameSession` ya existente, sin tocarla salvo para reemplazarla (restart) o descartarla (exit).

**Decisión clave (sesión SDD 2026-07-07):** el Dominio **no cambia**. `GameStatus` sigue siendo exactamente `IN_PROGRESS | WON | LOST` — no se le agrega `PAUSED`. Esto es obligatorio para no romper la spec ya cerrada de **G3** (temporizador), que asume "tiempo activo = IN_PROGRESS **y la UI fuera de PAUSED**", tratando PAUSED como un concepto de Presentación.

---

## User Review Required

> [!IMPORTANT]
> **Ningún archivo de Dominio existente se modifica.** `GameSession.ts`, `GameErrors.ts`, `PlayMoveUseCase.ts` quedan intactos. El guard de `PlayMoveUseCase` (`session.status !== 'IN_PROGRESS'`) ya es suficiente: mientras `PAUSED` no exista en `GameStatus`, basta con que la capa de input (B3) no reenvíe comandos cuando el tope de la pila no sea `ACTIVE` — no hace falta que el dominio lo sepa.

> [!IMPORTANT]
> **Un solo `GameFlowController` con varios métodos**, no un use case por acción (`PauseGameUseCase`, `ResumeGameUseCase`, etc.). Se aparta deliberadamente del patrón de 1-clase-por-use-case del resto de la Aplicación: aquí no hay reglas de negocio ramificadas por acción (como sí las hay en `PlayMoveUseCase`), son transiciones triviales de una pila con guards de precondición. Partirlo en 7 clases sería sobre-ingeniería para este alcance.

> [!WARNING]
> **`restart` necesita el `LevelData` original** (o al menos `allowedMoves`) para poder instanciar una `GameSession` nueva. El controller no lo carga por sí mismo — lo recibe inyectado en el constructor o en el propio método `restart(newSession)`. Ver Open Questions.

---

## Open Questions

| # | Pregunta | Opción recomendada |
|---|---|---|
| Q1 | ¿`restart(newSession: GameSession)` recibe la sesión ya construida por el caller (Presentation), o `restart(movesRemaining: number)` la construye internamente? | **Recibirla construida** (`restart(newSession: GameSession)`) — el controller no debe conocer cómo se arma una `GameSession` fresca (eso ya lo hace quien construyó la original al iniciar el nivel); mantiene el controller agnóstico de `LevelData`. |
| Q2 | ¿`exit()` es un método del controller que deja la pila en algún estado terminal, o simplemente se descarta la instancia completa del controller? | **Se descarta la instancia** — no hay "estado EXITED" que tenga sentido re-consultar. Presentation simplemente deja de renderizar el `GameFlowController` y navega. No requiere método `exit()` en la clase; ver Scenario "Salir" en el `.feature`, que se satisface con "dejar de usar la instancia", no con una transición de estado. |

Si no hay objeción, se procede con las recomendaciones.

---

## Proposed Changes

### Capa de Aplicación — DTOs / Tipos

---

#### [NEW] `src/application/dtos/GameFlowDTOs.ts`

```typescript
export type GameFlowState = 'ACTIVE' | 'PAUSED' | 'SETTINGS';
```

---

### Capa de Aplicación — Errores

---

#### [NEW] `src/application/errors/GameFlowErrors.ts`

```typescript
import type { GameFlowState } from '../dtos/GameFlowDTOs';

/**
 * Se lanza cuando se intenta una transición de flujo (pause/resume/openSettings/
 * closeSettings/restart) inválida para el tope de pila actual, o cuando se
 * intenta pausar una GameSession que ya no está IN_PROGRESS.
 */
export class InvalidFlowTransitionError extends Error {
  constructor(action: string, currentTop: GameFlowState) {
    super(`InvalidFlowTransitionError: cannot ${action} from state ${currentTop}`);
    this.name = 'InvalidFlowTransitionError';
  }
}
```

---

### Capa de Aplicación — Controller (autómata de pila)

---

#### [NEW] `src/application/services/GameFlowController.ts`

```typescript
import type { GameSession } from '../../domain/entities/GameSession';
import type { GameFlowState } from '../dtos/GameFlowDTOs';
import { InvalidFlowTransitionError } from '../errors/GameFlowErrors';

/**
 * Autómata de pila (Pushdown Automaton) del flujo de una partida (C1).
 * Envuelve una GameSession de Dominio sin mutarla salvo reemplazo total
 * (restart). Solo el tope de la pila debe recibir input/render — eso lo
 * decide quien consuma `current`, este controller solo lo expone.
 */
export class GameFlowController {
  private _session: GameSession;
  private readonly _stack: GameFlowState[];

  constructor(session: GameSession) {
    this._session = session;
    this._stack = ['ACTIVE'];
  }

  get session(): GameSession { return this._session; }
  get current(): GameFlowState { return this._stack[this._stack.length - 1]; }
  get stack(): readonly GameFlowState[] { return [...this._stack]; }

  pause(): void {
    if (this.current !== 'ACTIVE' || this._session.status !== 'IN_PROGRESS') {
      throw new InvalidFlowTransitionError('pause', this.current);
    }
    this._stack.push('PAUSED');
  }

  resume(): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('resume', this.current);
    }
    this._stack.pop();
  }

  openSettings(): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('openSettings', this.current);
    }
    this._stack.push('SETTINGS');
  }

  closeSettings(): void {
    if (this.current !== 'SETTINGS') {
      throw new InvalidFlowTransitionError('closeSettings', this.current);
    }
    this._stack.pop();
  }

  /** Reemplaza la GameSession actual por una nueva y colapsa la pila a [ACTIVE]. */
  restart(newSession: GameSession): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('restart', this.current);
    }
    this._session = newSession;
    this._stack.length = 0;
    this._stack.push('ACTIVE');
  }
}
```

**Nota de diseño:** no hay método `exit()`. Salir de la partida (Rule "Salir descarta la GameSession...") se modela como "Presentation deja de sostener esta instancia y navega" — no como una transición interna. Si en la implementación real de C4 se necesita un hook de "antes de destruir, notificar algo" (ej. analytics), se agrega ahí, no aquí.

---

### Capa de Presentación — integración con input (B3)

---

#### [MODIFY] Adaptador de input existente (B3)

Dondequiera que B3 hoy consulte `session.status !== 'IN_PROGRESS'` para bloquear input en estados terminales, debe además consultar `gameFlowController.current !== 'ACTIVE'` para bloquear input mientras `PAUSED`/`SETTINGS` estén en el tope. Este plan **no** localiza el archivo exacto de B3 a modificar — eso se resuelve en la sesión de implementación de C4 (que es quien realmente conecta el controller a la UI); aquí solo se deja el contrato (`GameFlowController.current`) que B3/C4 deben consultar.

---

### Tests

---

#### [NEW] `__tests__/application/GameFlowController.spec.ts`

Mapea 1:1 los Rules del `.feature`. Sin mocks — usa `GameSession` real.

```
describe('GameFlowController — estado inicial')
  it('se inicializa con stack = [ACTIVE]')

describe('GameFlowController — pause()')
  it('desde ACTIVE con session IN_PROGRESS: apila PAUSED')
  it('la GameSession no se muta (movesRemaining, status, score intactos)')
  it('lanza InvalidFlowTransitionError si session.status es WON')
  it('lanza InvalidFlowTransitionError si session.status es LOST')
  it('lanza InvalidFlowTransitionError si el tope ya es PAUSED')
  it('lanza InvalidFlowTransitionError si el tope es SETTINGS')

describe('GameFlowController — resume()')
  it('desde [ACTIVE, PAUSED]: desapila, vuelve a [ACTIVE]')
  it('la GameSession sigue igual tras resume')
  it('lanza InvalidFlowTransitionError si el tope no es PAUSED')

describe('GameFlowController — openSettings() / closeSettings()')
  it('openSettings desde [ACTIVE, PAUSED]: apila SETTINGS')
  it('openSettings lanza InvalidFlowTransitionError si el tope no es PAUSED (ej. desde ACTIVE)')
  it('closeSettings desde [ACTIVE, PAUSED, SETTINGS]: vuelve a [ACTIVE, PAUSED], no a [ACTIVE]')
  it('closeSettings lanza InvalidFlowTransitionError si el tope no es SETTINGS')

describe('GameFlowController — restart()')
  it('desde [ACTIVE, PAUSED]: reemplaza la session y colapsa a [ACTIVE]')
  it('la nueva session tiene movesRemaining = N fresco y score = null')
  it('lanza InvalidFlowTransitionError si el tope no es PAUSED')

describe('GameFlowController — invariante de Dominio')
  it('GameSession.status jamás observa PAUSED ni SETTINGS (solo IN_PROGRESS|WON|LOST) tras cualquier secuencia de transiciones de flujo')
```

---

## Archivos que NO se tocan

- `src/domain/entities/GameSession.ts`
- `src/domain/errors/GameErrors.ts`
- `src/domain/value-objects/ScoringTracker.ts`
- `src/domain/value-objects/Score.ts`
- `src/application/use-cases/PlayMoveUseCase.ts`
- `src/application/dtos/SessionDTOs.ts`
- `src/presentation/components/GameOverlay.tsx` (su alcance de WON/LOST no cambia; las pantallas de pausa/ajustes son un componente nuevo de C4, fuera de este plan)
- `__tests__/domain/GameSession.spec.ts`
- `__tests__/application/PlayMoveUseCase.spec.ts`

---

## Orden de Implementación (TDD estricto)

| Paso | Archivo | Justificación | Criterio de verificación |
|:---|:---|:---|:---|
| **1** | `src/application/dtos/GameFlowDTOs.ts` | Tipo base `GameFlowState` | Compilación correcta |
| **2** | `src/application/errors/GameFlowErrors.ts` | Error tipado para guards | Compilación correcta |
| **3** | `src/application/services/GameFlowController.ts` (stub: constructor + getters, sin lógica de transición) | Base mínima | Compilación correcta |
| **4** | `__tests__/application/GameFlowController.spec.ts` | **Red phase**: todos los tests fallan | Todos rojos |
| **5** | Implementar `pause()`, `resume()`, `openSettings()`, `closeSettings()`, `restart()` completos | **Green phase** | Todos verdes |
| **6** | `pnpm test` completo | Regresión: nada existente se rompe (GameSession/PlayMoveUseCase intactos) | Sin fallos |
| **7** | `pnpm lint` | Sin errores de linting | Sin errores |
| **8** | `pnpm gen-uml` | Actualizar diagrama de clases con `GameFlowController` | `classes.puml` actualizado |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| Confundir `GameFlowState` con `GameStatus` en el código (ambos son strings de 3 valores) | Nombres distintos y en módulos distintos (domain vs application); el test de invariante de Dominio verifica explícitamente que nunca se mezclan |
| `restart()` deja huérfana la `GameSession` anterior si alguien más guardaba una referencia | Fuera de alcance de este plan: quien sostiene la referencia (C4/Presentation) debe reemplazarla también al recibir el evento de restart; se documenta en el `.feature` pero no se resuelve con código de este controller |
| B3 (input routing) no consulta `GameFlowController.current` al integrarse | Se deja como contrato explícito en este plan para la sesión de implementación de C4, que es quien conecta el controller real a la UI y al input |
| Alcance de `MENU`/pantalla de inicio quedó fuera (D2 de la spec) | Correcto y deliberado — ver spec: "no hay partida" es ausencia de `GameFlowController`/`GameSession`, resuelto por routing de C3, no por esta FSM |

---

## Criterios de Completitud

```
[ ] GameFlowState definido: 'ACTIVE' | 'PAUSED' | 'SETTINGS'
[ ] InvalidFlowTransitionError lanzado con action + estado actual en el mensaje
[ ] GameFlowController inicializa stack = ['ACTIVE']
[ ] pause() exige tope ACTIVE y session.status === IN_PROGRESS
[ ] resume() exige tope PAUSED
[ ] openSettings() exige tope PAUSED; closeSettings() exige tope SETTINGS y vuelve a PAUSED
[ ] restart() exige tope PAUSED, reemplaza session, colapsa stack a [ACTIVE]
[ ] Ningún método muta GameSession salvo restart (reemplazo total de la referencia)
[ ] Todos los escenarios del .feature C1 cubiertos por tests
[ ] pnpm test pasa sin errores (incluye tests existentes de GameSession/PlayMoveUseCase sin modificación)
[ ] pnpm lint sin errores
[ ] pnpm gen-uml ejecutado (classes.puml actualizado)
[ ] Domain (GameSession, GameStatus, GameErrors) sin cambios
[ ] Entradas .ai-usage/ generadas (planning + implementation)
```
