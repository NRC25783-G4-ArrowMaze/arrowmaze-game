# AI Usage Report — FIX-2 Tail Collision Detection (Implementación)

### 2026-06-26 — FIX-2 `tail-collision-detection`: validación del destino de la cola en `Arrow.advance()`

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8
- **Autor humano responsable:** @Jrgil20
- **Fase:** implementation (TDD)
- **Feature:** `tail-collision-detection` (FIX-2, capa de dominio)
- **Linked session:** 2026-06-26-001 (planning)
- **Rama:** `fix/movement/tail`

- **Prompt(s) representativo(s):**
  - "Implementa FIX-2 (colisión de cola, dominio) siguiendo el plan ya aprobado del repo."

- **Hueco cerrado:**
  - `Arrow.advance()` validaba **solo** el destino de la **cabeza** (fase 3). En una flecha
    multi-celda el destino de la cabeza es su propio cuerpo (`self`, que se libera) → nunca
    bloquea. La única celda que entra a territorio nuevo es la **cola** (el frente), y su
    destino no se validaba → `Cell.placeArrowSegment` sobre-escribía en silencio (una serpiente
    atravesaba otra flecha).

- **Salida tomada de la IA:**
  - `src/domain/entities/Arrow.ts` — **único cambio de producción**: bloque "Phase 3.5" en
    `advance()` (tras el chequeo de cabeza, antes de `_commitAdvance`) que valida el destino de
    la cola contra ocupación ajena → `blocked` (rollback, sin mutar nada). Reutiliza
    `_cellBelongsToSelf`.
  - `__tests__/domain/arrow_tail_collision.spec.ts` — 8 tests (objetos reales del dominio, sin
    mocks) cubriendo los 3 bloques del Gherkin: colisión de cola, sin falsos positivos
    (libre / sumidero / lazy-checking off-route), compatibilidad (cabeza/1-celda; self).

- **Decisiones de implementación (según plan confirmado):**
  - **Alcance cola-only:** en head-push la cola es el único segmento que entra a celda nueva;
    basta validar su destino (la cabeza ya se valida para el caso 1-celda).
  - **Sumidero ≠ colisión:** destino `null` no bloquea (la cola se purga en el commit).
  - **`self` nunca bloquea** (vía `_cellBelongsToSelf`).
  - **No se tocó** `_calculateTargets`, `_commitAdvance`, `Cell` ni ningún use case.

- **Modificaciones manuales del equipo:** ninguna (implementación literal del plan).
- **Validación realizada:**
  - `pnpm test`: **233/233** (8 nuevos, 0 regresiones), 21 suites. Scenario 7 "Lazy checking"
    de `arrow_movement.feature` verificado intacto.
  - `pnpm lint`: sin errores (exit 0).
  - `pnpm gen-uml`: `classes.puml` regenerado (sin cambios de contenido — la API pública no varía).

> Con FIX-2 en su lugar, el slide de FIX-1 ya se detiene ante **serpientes** sin tocar
> `SlideArrowUseCase`: la detención llega del nuevo `blocked` de la cola en el dominio.
