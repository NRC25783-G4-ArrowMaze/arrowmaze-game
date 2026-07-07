# Addendum — Evaluación pre-implementación: game-session-scoring

> **Documento padre:** [`game-session-scoring_implementation_plan.md`](./game-session-scoring_implementation_plan.md)
> **Feature:** `game-session-scoring`
> **Fecha:** 2026-06-14
> **Origen:** Revisión pre-handoff (Claude Code) solicitada antes de implementar.
> **Veredicto:** ⛔ **Plan NO listo para handoff a Haiku** — 2 correcciones bloqueantes + 4 decisiones menores.

---

## 0. Propósito

Este addendum documenta los hallazgos de la evaluación del plan **antes** de la implementación.
No reescribe el diseño (eso vuelve a Antigravity por contrato); especifica los defectos concretos
que harían que Haiku se bloquee y la corrección requerida para cada uno.

Se revisó el plan contra:
- El código actual: `GameSession.ts`, `PlayMoveUseCase.ts`, `SessionDTOs.ts`, `AdvanceResult.ts`, `MovementDTOs.ts`.
- El feature Gherkin: `features/game-session-scoring.feature`.
- Los tests existentes que el plan promete no romper: `GameSession.spec.ts`, `PlayMoveUseCase.spec.ts`.

---

## 1. Veredicto sobre persistencia (requisito clave) — ✅ CONFIRMADO

> [!IMPORTANT]
> **El scoring vive enteramente en RAM. El plan NO introduce ninguna persistencia.**

Evidencia:

| Aspecto | Hallazgo |
|:---|:---|
| Estado del scoring | `_scoringTracker` y `_score` son propiedades en heap del aggregate `GameSession`, igual que `_movesRemaining` y `_status` hoy. |
| Exposición del resultado | `Score` se computa on-demand al transicionar a WON y se expone como un simple `number` en `PlayMoveResult.score`. No se serializa ni escribe a disco/DB. |
| Infraestructura | La sección *"Archivos que NO se tocan"* incluye **todo `src/infrastructure/`** y ambos repositorios. No se crea `IGameSessionRepository` (no existe hoy y el plan no lo añade). |
| Scope explícito | El feature lo deja por escrito: `features/game-session-scoring.feature:20` → *"Persistencia histórica y scaling por nivel: fuera de scope."* |
| Estado actual | `GameSession` **ya es efímero** (ningún repositorio lo persiste; se crea con `new GameSession(N)` y se recolecta por GC). Este plan **preserva** esa propiedad. |

**Conclusión:** el requisito del usuario está respetado al 100%. Las correcciones de abajo son de
testabilidad/aritmética, no afectan la naturaleza in-memory del diseño.

---

## 2. Hallazgos bloqueantes

### B-1 — Contradicción aritmética en `PlayMoveScoring.spec.ts`

- **Ubicación:** plan, sección `[NEW] __tests__/application/PlayMoveScoring.spec.ts`, describe *"score en PlayMoveResult"*, primer `it`.
- **Texto actual del plan:**
  > `it('victoria con 0 fallas: PlayMoveResult.score = 1300 (ticksUsed=1 → timeScore=998, + 500 flawless)')`
- **Problema:** con `ticksUsed=1` → `timeScore = 1000 − 1×2 = 998`; flawless → `998 + 500 = 1498`, **no 1300**.
  El valor `1300` corresponde a `ticksUsed=100` (escenario Gherkin Grupo 1), copiado por error a un test de un solo move.
- **Causa raíz:** una ejecución de `PlayMoveUseCase.execute()` == **1 tick** (un `recordMoveOutcome`). Llegar a `ticksUsed=100`
  exigiría 100 ejecuciones con un tablero que no se vacíe hasta el move 100 — inviable de montar a nivel de orquestador.

> [!WARNING]
> **Corrección requerida (recomendada):** a nivel use-case asertar el valor real de una victoria flawless de 1 move = **1498**.
> Reservar la tabla paramétrica de `ticksUsed=100` para el spec de dominio `GameSessionScoring.spec.ts`, donde los ticks
> se bombean directamente con `recordMoveOutcome`.

- **Texto propuesto:**
  > `it('victoria flawless en 1 move (destroyed): PlayMoveResult.score = 1498 — timeScore=998 + 500 flawless')`
- **Setup de referencia:** idéntico al test existente *"última flecha sale del tablero"* (`PlayMoveUseCase.spec.ts:111`):
  `Board` con 1 celda `A`, `A[0]` exit, `Arrow(A, 0)` → `destroyed` → board vacío → `WON`.
- **Criterio de verificación:** el test pasa con `result.score === 1498`.

---

### B-2 — Tests asertan sobre contadores internos que el diseño oculta deliberadamente

- **Ubicación:** plan, `PlayMoveScoring.spec.ts`, describes *"registro de outcomes"* y *"fallo de infra no registra outcome"*.
- **Tests afectados:**
  1. `'outcome=blocked registra falla: consecutiveFails incrementa'`
  2. `'outcome=advanced registra éxito: consecutiveFails se resetea'`
  3. `'outcome=destroyed registra éxito: consecutiveFails se resetea'`
  4. `'advanceResult.success=false: no invoca recordMoveOutcome, scoring intacto'`
- **Problema:** mientras la sesión está `IN_PROGRESS`, `session.score === null` **por diseño** (Grupo 3 + el propio Riesgo del plan
  *"`GameSession` no expone `_scoringTracker`"*). `consecutiveFails` y demás contadores viven dentro de `ScoringTracker`, que
  `GameSession` no expone. **No hay forma de observar** "consecutiveFails incrementa / se resetea" ni "scoring intacto" sin
  romper el encapsulamiento que el plan defiende. Los tests, tal como están descritos, **no son implementables**.
- **Causa raíz:** contradicción entre la regla de visibilidad (solo `score: Score | null`) y tests que asertan estado interno mid-game.

> [!WARNING]
> **Corrección requerida (recomendada):** la única responsabilidad nueva *observable* del use case es (a) mapear
> `advanceResult.outcome !== 'blocked'` → `moveSucceeded`, y (b) exponer `score` en WON. Verificarlo vía el `finalScore`
> observable tras victoria, no vía contadores internos.

Reescritura propuesta:

- **Tests 1-3 → tests comparativos de score.** Dos runs que terminan en `WON` con el **mismo número de ticks** pero
  distinto outcome en uno de los moves; asertar que el run con `blocked` tiene un `score` menor por **exactamente** la
  penalización esperada (`−10` para una falla aislada), y que el run con `advanced`/`destroyed` mantiene el score flawless.
- **Test 4 → run gemela.** Montar una run que falle en infra (`advanceResult.success=false`) y luego gane; comparar su
  `score` contra una run idéntica **sin** el intento fallido. Deben ser **iguales** (mismo `ticksUsed`, misma penalización),
  demostrando que el intento fallido no tocó el scoring. (Comportamiento ya correcto en el código: el guard de Step 3 retorna
  antes de `consumeMove`/`recordMoveOutcome`.)

- **Alternativa (NO recomendada):** exponer una proyección de solo-lectura del tracker → viola Grupo 3. Descartar salvo que
  Antigravity decida cambiar la regla de visibilidad.
- **Nota:** la mecánica pura de contadores (`blocked→recordFailure`, `success→recordSuccess`) **ya queda cubierta sin
  ambigüedad** en `ScoringTracker.spec.ts` y `GameSessionScoring.spec.ts` a nivel dominio. El spec de use-case solo debe
  verificar el *wiring*, no re-verificar la mecánica.

---

## 3. Hallazgos menores (no bloquean — requieren decisión de Antigravity)

### M-1 — Test de inmutabilidad de `Score` vs. "no `any`"

- **Ubicación:** plan, `Score.spec.ts`, describe *"immutability"* → `it('properties ... son readonly')`.
- **Problema:** `readonly` en TS es **solo compile-time**. Un test runtime de mutación requeriría `(score as any).x = …`,
  pero `any` está **prohibido** por CLAUDE.md. Sin `Object.freeze`, la asignación en JS plano ni siquiera lanzaría.
- **Opciones:**
  - **(a)** `Object.freeze(this)` en el constructor de `Score` + test con `// @ts-expect-error` sobre la asignación y
    verificación de que el valor no cambió. Cumple "sin `any`" y es un test ejecutable real.
  - **(b)** Eliminar el test runtime; confiar en `readonly` + `strict` como garantía de tipos.
- **Recomendación:** (a) si se quiere cobertura ejecutable; (b) si se prefiere minimalismo. Decisión de Antigravity.

### M-2 — `flawlessVictory === false` no es consultable en LOST

- **Ubicación:** `features/game-session-scoring.feature:136-140` — *"Derrota no produce score"* lista `flawlessVictory debe ser false` como `Entonces` aparte.
- **Problema:** con `score === null` en LOST, `flawlessVictory` no es consultable por separado (es propiedad de `Score`).
- **Recomendación:** aceptar explícitamente que **`score === null` implica ausencia de victoria flawless**. El test del Grupo 3
  asertará `score === null` y se documenta que cubre el `Entonces` de forma vacua. **No** añadir accessor extra (mantiene encapsulamiento).

### M-3 — Tests del Grupo 4 son tautológicos a nivel `GameSession`

- **Ubicación:** plan, `GameSessionScoring.spec.ts`, *"Grupo 4 — componentes descartados"*; `feature:152-164`.
- **Observación:** `GameSession` no modela `arrowsEvacuated` ni usa `movesRemaining` en el score, así que ambos tests comparan
  sesiones que solo difieren en **narrativa** (la variable que "varía" no es representable en el aggregate). Son fieles al spec
  (que fija `ticksUsed=100`) pero no prueban independencia real.
- **Recomendación:** mantener (son spec-faithful) y anotar en el test que la diferencia de evacuaciones/movimientos es **nominal**
  a nivel `GameSession`. Sin cambio de diseño.

### M-4 — (Opcional) Acople `Score` ↔ `ScoringTracker`

- **Observación:** `Score.compute(tracker: ScoringTracker)` ata el VO a la forma del tracker.
- **Alternativa:** `Score.compute(ticksUsed, totalFails, accumulatedPenalty)` con primitivos → desacopla el VO y simplifica sus tests.
- **Severidad:** cosmética/no bloqueante. El plan actual es aceptable. Solo registrar la opción.

---

## 4. Checklist de cambios antes del handoff

```
[ ] B-1  Test de victoria use-case: valor esperado = 1498 (o setup de 100 ticks documentado)
[ ] B-2  4 tests de "registro de outcomes" / "fallo de infra" reescritos para asertar sobre
         finalScore observable, sin exponer el tracker
[ ] M-1  Decidido el enfoque del test de inmutabilidad: (a) freeze + @ts-expect-error | (b) type-only
[ ] M-2  Aceptado score===null como cobertura de flawlessVictory=false en LOST (documentar en test)
[ ] M-3  Anotada la naturaleza nominal de los tests del Grupo 4
[ ] M-4  (Opcional) Evaluada la firma de Score.compute (tracker vs primitivos)
```

Una vez aplicados B-1 y B-2 (y resueltos M-1/M-2), el plan queda apto para handoff a Haiku.

---

## 5. Confirmación: lo que el plan hace bien (sin cambios)

| Aspecto | Estado |
|:---|:---|
| Diseño in-memory (sin persistencia, repos ni infraestructura) | ✅ Intacto — requisito clave respetado |
| Firmas existentes no se rompen (constructor, DTO, use case) | ✅ Verificado contra los tests existentes |
| Idempotencia de `evaluateStatus` (guard `!== 'IN_PROGRESS'` → `Score.compute` una sola vez) | ✅ Preservada |
| `Score` es un snapshot real (guarda primitivos, no referencia al tracker mutable) | ✅ Correcto |
| Aritmética del dominio (tabla paramétrica Grupo 5: `10 × n(n+1)/2`) | ✅ Las 10 filas cuadran |
| Orden TDD (stub → test rojo → impl verde) y orden de capas | ✅ Sólidos |
| Mapeo `import type` vs import de valor | ✅ Correcto en los 3 archivos nuevos |
| Cumplimiento `erasableSyntaxOnly` (sin parameter properties) | ✅ Constructores con asignación explícita |
```
