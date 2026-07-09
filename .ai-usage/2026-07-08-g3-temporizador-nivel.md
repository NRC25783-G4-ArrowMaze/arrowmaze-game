### 2026-07-08 — G3: Temporizador de nivel (SDD)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** implementation (spec-driven)
- **Feature:** G3-temporizador-nivel
- **Linked session:** `features/G3-temporizador-nivel.feature` (spec fuente, sincronizado desde arrowmaze-project-core)

- **Prompt(s) representativo(s):**
  - "Implementa G3 (temporizador de nivel) spec-driven; el .feature manda (D1–D4, P23 fuera)."
  - "Diseña el reloj para que el tiempo PAUSADO no cuente — el bug clásico — cubierto con reloj falso."
  - "Puerto IClock inyectable; nadie lee el reloj del sistema directo; parada obligatoria en la tabla."

- **Salida tomada de la IA:**
  - `src/application/ports/IClock.ts` \[NEW\] — puerto de reloj inyectable (D3).
  - `src/infrastructure/time/SystemClock.ts` \[NEW\] — impl real (único `Date.now()` del timer).
  - `src/presentation/game/levelTimer.ts` \[NEW\] — `LevelTimer` (tiempo activo, congela en pausa sin acumular) + `formatDuration` mm:ss puro.
  - `src/presentation/game/useLevelTimer.ts` \[NEW\] — hook: driver por `running`, reinicio por cambio de partida, tick 4×/s que NO corre en pausa y se limpia en unmount.
  - `src/presentation/components/LevelTimerDisplay.tsx` \[NEW\] — display mm:ss + aria-label i18n.
  - Integración: `GameView` (header, junto a Movimientos) y `GameOverlay` (tiempo final junto al score, en WON y LOST).
  - Claves i18n nuevas en ambos catálogos: `game.time`, `game.timeElapsed`, `overlay.time`.
  - Tests \[NEW\]: `levelTimer.spec` (FakeClock: arranque, pausa-congela, WON/LOST conserva, restart→0, determinismo), `levelTimerFormat.spec` (mm:ss + bordes 09:59/10:00/60:00), `levelTimerDisplay.spec` (render). `gameOverlay.spec` ampliado (tiempo vía catálogo `overlay.time`).

- **Modificaciones manuales del equipo:**
  - Decisión aprobada por el autor: el `Date.now()` preexistente de la marca de tiempo del **score** en `GameView` (persistencia A5) queda **INTACTO** — P23 fuera de alcance, flujo de persistencia bajo investigación activa (bug del APK con logcat), y "el score no se toca".
  - Trade-off de tests (igual criterio que G2): lógica pura (`LevelTimer`, `formatDuration`) como función pura con FakeClock; componentes que consumen i18n con `render()`. `useLevelTimer` usa `eslint-disable-next-line react-hooks/set-state-in-effect` puntual para el reflejo inmediato de transición (mismo patrón que `useGameController` con react-hooks).
  - Alcance respetado: cero cambios en `src/domain` y `src/application/services`; el timer no toca dominio ni score; FORGE fuera; catálogos solo con claves nuevas agregadas.

- **Validación realizada:**
  - `npm test` → **43 suites / 370 tests** (base dev 40/351 → +3 suites, +19 tests; 0 regresiones). El test de paridad exigió las 3 claves nuevas en ambos catálogos.
  - `npx tsc --noEmit` → **0 errores**. ESLint sin errores en archivos G3.

#### 📋 Resumen de la sesión
Timer visual como proyección de presentación: cuenta hacia arriba en mm:ss, nunca causa derrota, se congela en PAUSED, se detiene en WON/LOST conservando el valor y se reinicia con `restart`. Reloj inyectable (IClock) → 100% reproducible con reloj falso; el bug de la pausa cubierto por test.

**Follow-ups declarados (deuda documentada, ajena a G3):**
- **P23 (tiempo→score):** integrar el tiempo en el score requiere enmendar A5 (dominio); se cerrará en su propia sesión SDD.
- **Migrar la marca de tiempo del score a IClock** cuando se cierre la investigación de persistencia (hoy usa `Date.now()` directo en `GameView`; D3 se cumple para el timer, este `Date.now()` preexistente queda como deuda).
