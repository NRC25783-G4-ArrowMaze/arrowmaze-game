# 📋 PLAN — Movimiento Continuo de la Flecha (Deslizamiento por Toque)

> **Estado: SPEC — PENDIENTE DE APROBACIÓN DE ECONOMÍA.** Este documento especifica la
> propuesta del autor del PR #10 ("al tocar una flecha, avanzar de corrido hasta chocar o
> salir del tablero"). **No se implementa** hasta resolver las decisiones D1–D3 (sección
> "Decisiones de Diseño ABIERTAS"). El feature file correspondiente es
> [`features/continuous-movement.feature`](../features/continuous-movement.feature).

## Resumen

Hoy (PR #10, bloque B3) **un toque = un tick = `Arrow.advance()` = una celda**. La propuesta es
que **un toque dispare N ticks de corrido**, iterando `Arrow.advance()` hasta que el outcome del
dominio sea `'blocked'` o `'destroyed'` (salir del tablero == `destroyed`), o hasta una cota de
seguridad `maxTicks`.

El **dominio no cambia**: `Arrow.advance()` sigue siendo un tick atómico de una sola celda. La
iteración y el accounting de sesión viven en **aplicación/presentación**. Lo único realmente nuevo
a nivel de diseño es **la economía** (puntaje, movimientos consumidos, penalización), que el autor
dejó deliberadamente parada porque cambia la dificultad del juego.

---

## Contexto y Motivación

- **Comportamiento actual:** `PlayMoveUseCase.execute()` → `AdvanceArrowUseCase` → `Arrow.advance()`.
  Cada toque: `consumeMove()` (−1 movimiento), `recordMoveOutcome()` (scoring), `evaluateStatus()`.
- **Scoring actual:** `timeScore = max(0, 1000 − ticksUsed × 2)`; penalización por rachas de fallos;
  bonus `flawless` si cero fallos (ver `src/domain/value-objects/Score.ts`, `ScoringTracker.ts`).
- **Propuesta del autor (PR #10):** mejora de UX — resolver el nivel con un gesto por flecha.
  Impacto directo en la economía: N ticks por toque cambian `ticksUsed`, `movesRemaining` y las
  penalizaciones.

---

## Decisiones de Diseño ABIERTAS (requieren aprobación ANTES de implementar)

| # | Pregunta | Opción A | Opción B | Recomendación |
|---|----------|----------|----------|---------------|
| **D1** | ¿Cuántos `movesRemaining` consume un toque continuo? | **1 por toque** (sin importar N celdas) | **N** (uno por celda recorrida, = economía actual) | Definir con diseño de juego: A favorece UX, B preserva la dificultad existente. |
| **D2** | ¿Cómo cuenta el tick para `timeScore = 1000 − ticksUsed×2`? | **+N** (cada celda recorrida es un tick — mantiene el decay actual) | **+1** (un toque = un tick — premia deslizamientos largos) | A mantiene el balance de scoring ya probado (214→197 tests); B reescala el balance. |
| **D3** | ¿Penalización si el gesto termina en `'blocked'`? | El `blocked` final cuenta como **una falla** (racha + penalización, como hoy) | Solo penaliza si **no avanzó ninguna celda**; si avanzó ≥1, no penaliza | A es consistente con el modelo actual; B premia el progreso parcial. |

> ⚠️ **D1 y D2 condicionan la arquitectura** (ver siguiente sección): si se elige consumir/contar
> **por celda** (D1.B / D2.A), el nuevo use case puede **envolver `PlayMoveUseCase`** tal cual. Si se
> elige **por toque** (D1.A / D2.B), el use case debe envolver **`AdvanceArrowUseCase`** (movimiento
> puro) y hacer el accounting de sesión **una sola vez** al final, porque `PlayMoveUseCase` ya
> consume movimiento y registra outcome por tick.

---

## Decisiones de Diseño (Resueltas)

| # | Decisión | Resolución |
|---|----------|------------|
| R1 | Capa de la iteración | Aplicación (nuevo `PlayContinuousMoveUseCase`). El dominio no itera. |
| R2 | Condición de parada | Iterar mientras `outcome === 'advanced'`; parar en `'blocked'`/`'destroyed'`. |
| R3 | Terminación garantizada | Cota dura `maxTicks` (p. ej. nº de celdas del tablero) para evitar bucles. |
| R4 | Animación | La presentación reproduce la **secuencia** de resultados (glide encadenado, recoil/fade final). Modelo bloqueante: no se aceptan toques mientras anima. |
| R5 | Dominio intacto | `Arrow.advance()`, `GameSession`, `Score` **no se modifican**. |

---

## Propuesta de Cambios (diseño — NO implementar hasta aprobar D1–D3)

### ─── CAPA: `src/application/dtos/` ──────────────────────────

`MovementDTOs.ts` (extender): `PlayContinuousMoveInput` (arrowId/handle del board + maxTicks
opcional) y `PlayContinuousMoveResult` (outcome final, `ticks` recorridos, lista de
`AdvanceResultDTO` intermedios para animar, `movesRemaining` final, `gameStatus`, `score?`).

### ─── CAPA: `src/application/use-cases/` ─────────────────────

`PlayContinuousMoveUseCase` (NEW). Orquesta el bucle de parada. **La forma exacta depende de D1/D2:**

- **Si D1.B + D2.A (por celda):** envuelve `PlayMoveUseCase.execute()` en un `while (outcome === 'advanced')`,
  acumulando resultados. Cada iteración ya consume movimiento y registra outcome (comportamiento actual × N).
- **Si D1.A + D2.B (por toque):** envuelve `AdvanceArrowUseCase.execute()` en el bucle (movimiento puro,
  sin tocar sesión), y al terminar hace **un solo** `session.consumeMove()` + `session.recordMoveOutcome(...)`
  + `session.evaluateStatus(board)`. Requiere exponer ese accounting de forma reutilizable.

### ─── CAPA: `src/presentation/` (sobre la base del PR #10) ────

- `GameController` / `useGameController`: añadir `playContinuousMove(command)` que delega al nuevo use case.
- `tapResolver` / `useBoardInput`: el toque emite el comando continuo (en vez de un único `PlayMoveCommand`).
- `useTickAnimation`: reproducir la **secuencia** de `AdvanceResultDTO` (encadenar glides; recoil/fade al final).

---

## Archivos que NO se tocan

- `src/domain/**` — **todo el dominio intacto** (`Arrow.advance()`, `GameSession`, `Score`, `ScoringTracker`).
- `src/application/use-cases/AdvanceArrowUseCase.ts` y `PlayMoveUseCase.ts` — se **reutilizan**, no se rompen.
- El comportamiento "un toque = un tick" del PR #10 puede conservarse como modo alterno si se desea.

---

## Orden de Implementación (para el PR futuro)

| Paso | Acción | Justificación |
|---|---|---|
| 0 | **Resolver D1, D2, D3** (diseño de juego) | Bloqueante. Determina la arquitectura del use case. |
| 1 | DTOs `PlayContinuousMoveInput/Result` | Contrato de frontera. |
| 2 | `PlayContinuousMoveUseCase` (forma según D1/D2) | Núcleo de la iteración. |
| 3 | Tests de aplicación (1:1 con `continuous-movement.feature`, bloques 1–2) | Deslizamiento + gating. |
| 4 | Tests de economía (bloque 3) según la opción aprobada | Quitar `@pending` al resolver D1–D3. |
| 5 | Wiring de presentación (controller + input + animación de secuencia) | UX final. |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|---|---|
| Reescalado de la economía rompe el balance de niveles ya diseñados | Decidir D1/D2 con datos; considerar conservar el modo 1-tick como opción. |
| Bucle infinito si la topología tuviera un ciclo | Cota dura `maxTicks` (R3). |
| Animación de secuencia larga bloquea demasiado el input | Límite de duración / velocidad de glide configurable; gating por deslizamiento. |
| Acoplar accounting de sesión al nuevo use case (opción D1.A) | Exponer el accounting de `PlayMoveUseCase` de forma reutilizable sin duplicar reglas. |

---

## Criterios de Completitud (del PR futuro)

- [ ] D1, D2, D3 resueltas y reflejadas en el feature file (sin `@pending`).
- [ ] Escenarios de los bloques 1–3 de `continuous-movement.feature` pasan como tests de Jest.
- [ ] Dominio sin cambios (diff de `src/domain/**` vacío).
- [ ] Sin `any`; `import type`; errores tipados; separación de capas respetada.
- [ ] `pnpm test`, `pnpm build`, `pnpm lint` en verde.

---

## Verificación

```bash
pnpm test -- --testPathPattern="continuous"   # tests del feature (cuando existan)
pnpm test                                       # no-regresión global
pnpm build && pnpm lint
```
