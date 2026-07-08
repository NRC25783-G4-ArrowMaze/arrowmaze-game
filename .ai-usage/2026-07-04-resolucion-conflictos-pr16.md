### 2026-07-04 — Resolución de conflictos PR #16 + matriz de decisiones

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Fable 5 (resolución), Claude Haiku 4.5 (reporter)
- **Autor humano responsable:** @Jrgil20

- **Prompt(s) representativo(s):**
  - "Revisa este PR con muchos conflictos de dos fuentes diferentes — último merge a main que no estaba cuando se creó la rama y diferencias en ai usage. Evalúa lo que aporta y si cumple con todo"
  - "Recuerda que gran parte de la complejidad en resolver conflictos es ver qué se mantiene de qué rama, cuando se conserva de ambas y cuando hay que corregir. Quiero que antes del commit de resolución generes una matriz de qué se eligió y por qué"
  - "Crea el propio ai-usage con esa matriz de decisión insertada en este y genera el commit del pr"

- **Salida tomada de la IA:**

  **Análisis de conflictos:**
  - Identificación de 2 fuentes de conflicto: archivos de presentación no evolucionados (arrastraban PR #10) + divergencia en `.ai-usage/`
  - Verificación byte a byte de que 7 archivos add/add del PR eran **idénticos** a lo que ya estaba en dev (sin regresión)
  - Reporte estado real: 12 conflictos resolubles, 2 DTOs muertos a eliminar, 1 lint error a corregir

  **Resolución e integración:**
  - `src/App.tsx`: combinación de base dev (SAMPLE_LEVEL_2, BOARD_SIZE 560, signals, stats) + wiring de persistencia/sync de feature13
  - `.ai-usage/README.md` y `manifest.json`: base dev + fila retroactiva y entrada 2026-06-27-004 con campos obligatorios
  - Estadísticas actualizadas: 29 reportes, 247/247 tests, 123 archivos creados, 8440 LOC generadas
  - `LocalProgressModuleFactory.ts:51`: lint fix (`cause` error chain para preserve-caught-error)
  - Eliminación de `LeaderboardDTO.ts`, `ProgressDTO.ts` (código muerto) y `src/infrastructure/shared/contracts/` (conflictaba con refactor de #14)

  **Matriz de decisiones por archivo:**
  - Presentación (7 archivos): CONSERVAR dev (idéntico al trabajo de #10 ya en dev, evoluciones de #12/#14)
  - App.tsx: COMBINAR (base dev de B1-B3 + persistencia de feature13)
  - AI usage: COMBINAR (base dev + retroactiva 2026-06-27-004)
  - DTOs / dirs: ELIMINAR (reintroducían lo que auditoría #14 limpió)

  **Verificación:**
  - `pnpm test`: 247/247 ✅ en 24 suites (228 dev + 19 feature13 = +17 de persistencia)
  - `npx tsc -b`: exit 0 ✅
  - `npx eslint .`: exit 0 ✅ (lint fix aplicado)
  - Preview navegador: ✅ (juego cargable, 13 movimientos, input habilitado)

- **Modificaciones manuales del equipo:**

  1. **App.tsx (LÍNEAS 72-87):** Se cambió el efecto de guardado para usar `game.score !== null` en lugar de truthy (previene pérdida de score 0); se reinsertó TODO explícito para `timeElapsedSeconds` provisional
  2. **Eliminación de DTOs muertos:** No costó trabajo que valiera la pena; evita reintroducir la violación de fronteras de capas que #14 removió
  3. **Manifest y README:** Entrada retroactiva 2026-06-27-004 curada manualmente (campos `phase/feature/linked_session` completados desde el reporte .md que Santiago dejó sin indexar)
  4. **LocalProgressModuleFactory.ts:** Error chain `{ cause: error }` para pasar eslint

- **Validación realizada:**

  - ✅ Merge test con worktree local: todos los conflictos resolubles sin pérdida de lógica
  - ✅ Tests: 247/247 pasando (0 regresiones); suites crecen de 20 → 24 (feature13 suma 4 suites)
  - ✅ ESLint: regla `preserve-caught-error` de #14 ahora satisfied
  - ✅ TypeScript strict: tsc exit 0
  - ✅ Runtime navegador: tablero renderiza, input responde (error de SQLite en web es esperado → degradación limpia sin persistencia)
  - ✅ Validación de AI usage: manifest.json parseado, README índice actualizado, totalReports +1

---

#### 📋 Resumen de la sesión

- **Duración estimada de la sesión:** 26 turnos / ~50 minutos
- **Contexto de la conversación:** Resolución de un PR con persistencia SQLite + sync bidireccional que conflictaba con 2 merges posteriores (`dev` había adelantado, presentación evolucionó). El usuario pidió explícitamente una matriz de decisiones transparente antes de comprometer.
- **Decisiones clave tomadas:**
  1. Descartar presentación duplicada del PR (era idéntica a #10 ya mergeado; conservar dev evitaba regresión)
  2. Combinar App.tsx cuidadosamente: base dev de B1-B3, reinsertar init de persistencia sin casts de escape
  3. Indexar retroactivamente el reporte de AI usage del 27-06 (estaba huérfano) con metadatos completados
  4. Eliminar DTOs de infraestructura que violaban las fronteras que la auditoría de #14 acababa de establecer
- **Patrones de uso observados:** Directivo-verificativo — el usuario pedía verificación antes de cada decisión importante (byte-a-byte de archivos, matrix explícita de qué se elige de dónde); énfasis en transparencia y evitar sorpresas en el commit final

---

**Deuda técnica post-merge — estado tras la segunda fase de la sesión (2026-07-04):**
- ✅ **RESUELTO** — Puertos movidos de `domain/repositories/` a `application/ports/` (`ILocalProgressRepository`, `IProgressApiClient`, `IAuthTokenProvider`); `ILevelRepository` permanece en dominio (excepción documentada en CLAUDE.md). Imports actualizados en 12 archivos.
- ✅ **RESUELTO** — `LevelProgress.create` ahora lanza `InvalidLevelProgressError` (nuevo `src/domain/errors/ProgressErrors.ts`, patrón de `GameErrors.ts`) + 2 tests nuevos en el spec de dominio.
- ✅ **RESUELTO** — Renombres con `git mv`: `CapacitorTokenProvides.ts` → `CapacitorTokenProvider.ts`, `SaveOfflineProgress.ts` → `SyncOfflineProgress.ts`, `SaveLocalProgres.spec.ts` → `SaveLocalProgress.spec.ts`.
- ✅ **RESUELTO** — `timeElapsedSeconds` real: timer de presentación (`useRef` + efecto de montaje, cumple regla de pureza de React) que mide desde el inicio del nivel hasta el WON. Ya no se persiste el valor falso de 45s.
- ⏳ **PENDIENTE (Santiago)** — Gherkin en `features/` y plan en `doc/` (aviso publicado en el PR #16).

Verificación tras la segunda fase: 249/249 tests ✅ (+2 del error tipado) · tsc exit 0 ✅ · eslint exit 0 ✅ · preview navegador OK ✅ · `classes.puml` regenerado con las rutas nuevas.
