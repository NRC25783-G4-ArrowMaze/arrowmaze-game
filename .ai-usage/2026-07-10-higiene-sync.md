### 2026-07-10 — Higiene del sync: scheduler single-flight con gate de sesión

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David
- **Fase:** fix (higiene / presentación + composition root)
- **Feature:** fix/higiene-sync
- **Linked session:** diagnóstico de QA multi-cuenta (juan2 y el leaderboard); Paso 2 de la cola sync→D1.5→modo oscuro

- **Prompt(s) representativo(s):**
  - "Gate de sesión: App entrega prop requestSync a GameView (deja de llamar syncProgress directo). Sin sesión → NO-OP SILENCIOSO."
  - "createSyncScheduler puro: single-flight + coalescing (en vuelo + pedido nuevo = una re-ejecución al terminar; ni descarte ni cola). Login y victoria pasan AMBOS por el scheduler."

- **Salida tomada de la IA:**
  - `src/presentation/sync/createSyncScheduler.ts` \[NEW\] — `createSyncScheduler(executor, isEnabled)`: gate consultado en cada request y en la re-ejecución coalescida; single-flight; coalescing (N pedidos en vuelo → 1 re-run); fallos → `console.warn`, jamás rompe el juego ni se atasca. + `createSessionSyncControl()`: envuelve la configuración mutable (sesión/módulo) tras métodos para el composition root.
  - `src/App.tsx` \[MOD\] — control único (`useState(createSessionSyncControl)`); el sync del login pasa por el scheduler; `requestSync` inyectado a GameView; el 401 del bootstrap apaga el gate.
  - `src/presentation/components/GameView.tsx` \[MOD\] — prop `requestSync?`; tras el save del WON pide el sync al composition root (ya no llama `syncProgress` directo). La política (¿sesión?, ¿en vuelo?) vive en App.
  - `__tests__/presentation/syncScheduler.spec.ts` \[NEW\] — 7 specs puros: (a) con sesión ejecuta · (b) sin sesión NO-OP silencioso (ni warn ni info) · (d) single-flight y coalescing (N→1 re-run, sin pendientes fantasma) · fallo → warn y scheduler utilizable · re-gate en la re-ejecución (logout en vuelo).

- **Modificaciones manuales del equipo:**
  - Decisiones selladas: no-op silencioso sin sesión; (c) "login intacto" cubierto por el spec del scheduler + QA visual (sin test de integración de App).
  - Nota de hechos del diagnóstico: el disparo tras ganar YA existía (GameView, D2); esta misión es higiene (gate + anti-solape), no el fix del síntoma de QA.

- **Validación realizada:**
  - `npm test` → **544 tests / 66 suites** (base 537/65 → +7; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**; `eslint` → 0 en los archivos tocados (incluido el React Compiler).

#### 📋 Resumen de la sesión
Los tres disparadores del sync no se coordinaban y el de la victoria salía sin sesión (401 seguro). Ahora login y victoria piden el sync a un scheduler único del composition root: gate de sesión (no-op silencioso deslogueado), single-flight y coalescing — el récord ganado durante el sync del login siempre alcanza a subir, y jamás hay dos pushes solapados. `SyncProgress`, adapter y dominio intactos.

**⚠️ Deuda de diseño documentada (la resuelve el Paso 3 — D1.5 progreso por cuenta):** el progreso local (SQLite) es **del dispositivo, no de la cuenta** — tabla `level_progress` sin usuario. Consecuencias: (1) una corrida que no bate el récord del dispositivo no se guarda ni se sube aunque sea el mejor personal de la cuenta activa (por eso juan2 no aparece en leaderboards); (2) pendientes de una cuenta pueden subir bajo el token de otra. Esta misión NO cambia eso.

**Notas / follow-ups:**
- Rama `fix/higiene-sync` desde el tip de `feat/login-bienvenida` (`7cf592b`); PR en cascada tras el del toast.
- El sync del bootstrap (una vez al arranque) queda fuera del scheduler por alcance; residual menor anotado.
- Id `2026-07-10-005`.
