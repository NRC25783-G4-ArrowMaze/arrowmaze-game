# AI Usage Report — Planning de Fixes de Movimiento (FIX-1 + FIX-2)

### 2026-06-26 — Planning de dos fixes de movimiento (slide en aplicación + colisión de cola en dominio)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8
- **Autor humano responsable:** @Jrgil20
- **Fase:** planning (spec-driven, sin implementación de código)
- **Feature:** `slide-arrow-movement` (FIX-1, aplicación) + `tail-collision-detection` (FIX-2, dominio)
- **Linked session:** 2026-06-22-001

- **Prompt(s) representativo(s):**
  - "quiero ver el render del juego usando el motor existente; el mock del mapa me gusta pero las flechas las quiero estilo neón tradicional"
  - "no puedo hacer click para probar el layout; haz una página oculta para probar el mock"
  - "el avance es por ticks/clicks; en aplicación un click debería ser ticks hasta salir o colisionar"
  - "estos son features tipo fix, hagamos 2; primero el más sencillo (aplicación), luego el de dominio"
  - "haz una rama para ambos fix y de ahí sub-ramas; el ai-usage del plan en esa sola rama"

- **Salida tomada de la IA (solo planificación / specs):**
  - `features/slide-arrow-movement.feature` — Gherkin del slide (1 click = ticks hasta terminal).
  - `doc/slide-arrow-movement_plan.md` — plan de `SlideArrowUseCase` (aplicación; **no toca dominio**).
  - `features/tail-collision-detection.feature` — Gherkin de la colisión en la cola.
  - `doc/tail-collision-detection_plan.md` — plan del fix quirúrgico en `Arrow.advance()` (dominio).

- **Hallazgo de diseño (verificado contra código + spec):** `Arrow.advance()` valida solo el destino de la **cabeza**; en una flecha multi-celda ese destino es self, por lo que el frente real (**la cola**) entra a celdas nuevas sin validar y `Cell.placeArrowSegment` sobre-escribe en silencio. El modelo del dominio es *head-push* (cabeza atrás, cola adelante), confirmado en `features/arrow_movement.feature`. FIX-2 cierra ese hueco validando también el destino de la cola.

- **Decisiones confirmadas por el humano:**
  - Slide: **1 click = 1 movimiento** (no 1 por tick); 1 registro de scoring por slide.
  - FIX-1 no toca dominio ni `PlayMoveUseCase`; FIX-2 es el único cambio de dominio (validación de cola en fase 3).
  - Estructura de ramas: `fix/movement/base` (planes + este AI-usage) → sub-ramas `fix/movement/slide` y `fix/movement/tail`.

- **Modificaciones manuales del equipo:** ninguna aún (fase de planning; implementación pendiente en las sub-ramas).
- **Validación realizada:** sin build/lint/tests (solo specs y planes). Specs validados contra el código real del dominio (`Arrow.advance`, `Head`, `Cell`, `arrow_movement.feature`).

> Implementación pendiente: FIX-1 en `fix/movement/slide` (TDD), FIX-2 en `fix/movement/tail` (TDD + regresión completa del dominio).
