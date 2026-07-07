### 2026-07-07 — Sesión SDD e implementación de C1 (GameFlowController) + fix de infraestructura de tests

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** claude-sonnet-5 (sesión SDD) / claude-fable-5 (implementación)
- **Autor humano responsable:** @Jrgil20
- **Prompt(s) representativo(s):**
  - "revisa en los commits quién implementó C1 (Máquina de estados del ciclo de vida de una partida) y por qué falta el feature"
  - "pero nunca se escribió el .feature así que no se puede considerar implementado, correcto"
  - "Para mantener la escalabilidad del código... los motores implementan autómatas de pila (Pushdown Automata)... Al detonar el evento de pausa, el estado actual no se destruye ni se reinicia; simplemente se suspende... El bucle principal delega los ciclos de CPU exclusivamente al estado que se encuentra en la cima de la pila"
  - "okay crea el feature y el plan para implementar lo que falta de c1"
  - "implementa el plan en arrowmaze-game"
- **Salida tomada de la IA:**
  - `arrowmaze-project-core/features/C1-maquina_estados_partida.feature` \[NEW\] — Spec Gherkin de la FSM de flujo (7 Rules, 15 escenarios): autómata de pila ACTIVE/PAUSED/SETTINGS, guards de transición, invariante de separación Dominio/Presentación.
  - `doc/C1-maquina-estados-flujo_plan.md` \[NEW\] — Plan de implementación TDD.
  - `src/application/dtos/GameFlowDTOs.ts` \[NEW\] — Tipo `GameFlowState`.
  - `src/application/errors/GameFlowErrors.ts` \[NEW\] — `InvalidFlowTransitionError`.
  - `src/application/services/GameFlowController.ts` \[NEW\] — Autómata de pila (Pushdown Automaton) que envuelve `GameSession` sin mutar el Dominio; `pause/resume/openSettings/closeSettings/restart`.
  - `__tests__/application/GameFlowController.spec.ts` \[NEW\] — 18 tests que mapean 1:1 los Rules del `.feature`.
  - `package.json` \[FIX\] — Restauración de scripts (`test`, `test:watch`, `gen-uml`) y dependencias (jest, ts-jest, testing-library, axios, Capacitor) eliminadas accidentalmente por el commit del FORGE (`c4ab239a`, PR #19); `src/infrastructure` seguía importando `@capacitor/*` sin dependencia declarada.
  - `jest.config.cjs` \[FIX\] — `ignoreDeprecations: '6.0'` (TypeScript 6 deprecó `moduleResolution: 'node'`; las 29 suites fallaban al compilar).
  - `__tests__/domain/LevelSelectionProjection.spec.ts` \[FIX\] — Test de C3 movido desde `src/domain/services/` (importaba `vitest`, nunca instalado — jamás corrió) a la convención `__tests__/` con jest; sus 12 tests ahora corren.
  - `classes.puml` \[REGEN\] — Diagrama regenerado con `GameFlowController`.
  - `src/presentation/game/useGameController.ts` \[MODIFY\] — Integración B3 del plan: instancia el `GameFlowController`, expone `flowState` + acciones (`pause/resume/openSettings/closeSettings/restart`) para C4, y descarta `PlayMoveCommand` cuando el tope de la pila no es `ACTIVE`.
  - `src/presentation/game/GameController.ts` \[MODIFY\] — Getter `gameSession` para que el flujo de UI envuelva la sesión viva sin copiarla.
  - `src/presentation/components/GameView.tsx` \[MODIFY\] — El adaptador de input (B3) también se deshabilita cuando `flowState !== 'ACTIVE'`.
- **Modificaciones manuales del equipo:** Ninguna sobre el código; las decisiones de diseño (D1–D5 de la sesión SDD) fueron del humano vía Q&A estructurada.
- **Validación realizada:** `pnpm test` — 29 suites / 292 tests, todos pasan (incluye los 18 nuevos y los 12 de C3 que nunca habían corrido); `pnpm type-check` limpio; eslint limpio en los archivos nuevos (8 errores globales preexistentes ajenos, documentados); `pnpm gen-uml` ejecutado.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~15 turnos / ~60 minutos
- **Contexto de la conversación:** Auditoría del estado real de C1 en `FEATURES.md` → detección de que se implementó sin `.feature` (violando la trazabilidad SDD del proyecto) y con diseño incompleto (sin pausa/ajustes) → sesión SDD formal → implementación TDD del faltante.
- **Decisiones clave tomadas:** (1) PAUSED vive en un autómata de pila en Aplicación/Presentación, NO en `GameStatus` de Dominio — reconciliado con la spec ya cerrada de G3 que asume PAUSED como concepto de UI; (2) MENU queda fuera de la FSM ("no hay partida" = ausencia de `GameFlowController`, routing de C3); (3) reloj se congela al pausar; salidas de PAUSED: resume/restart/exit; SETTINGS solo se apila sobre PAUSED; (4) el humano aportó la referencia arquitectónica de Pushdown Automata de la industria de videojuegos que definió el diseño.
- **Patrones de uso observados:** Mixto — auditoría dirigida (quién/por qué en git), corrección del humano al estado de la documentación, elicitación Q&A estructurada estilo SDD, aporte conceptual del humano (PDA), e implementación directiva con verificación completa.
