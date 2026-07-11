### 2026-07-10 — Leaderboards en el cliente (clasificación por nivel)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context) + Claude Fable 5 (cierre)
- **Autor humano responsable:** Juan David
- **Fase:** feature (leaderboards / presentación + application + infra)
- **Feature:** feat/leaderboards-cliente (apilada sobre feat/badge-usuario)
- **Linked session:** [[2026-07-10-badge-usuario]] — la sinergia "no logueado → abre AccountOverlay" usa el badge/cuenta de la Misión 1

- **Prompt(s) representativo(s):**
  - "Pantalla de clasificación por nivel consumiendo GET /api/v1/leaderboards/:levelId (Bearer). Estados: cargando · error · vacío · no logueado → CTA a cuenta · 401 en vuelo → mismo camino."
  - "El 404 LevelRegistryError se trata EN LA UI igual que el vacío + console.warn; el test del adapter distingue 404 de vacío (contrato fiel)."

- **Salida tomada de la IA:**
  - `src/application/dtos/LeaderboardDTOs.ts` \[NEW\] — espejo del contrato (`topPlayers` + `currentRecord`; `username` = alias seguro del backend).
  - `src/application/ports/ILeaderboardApiClient.ts` \[NEW\] — puerto + `LevelNotRegisteredError` tipado (404 ≠ vacío, cohesivo con el contrato).
  - `src/application/services/GetLevelLeaderboard.ts` \[NEW\] — caso de uso delgado (el backend ya ordena/rankea).
  - `src/infrastructure/api/FetchLeaderboardApiClient.ts` \[NEW\] — adapter con spec de contrato: URL exacta `/api/v1/leaderboards/:levelId`, GET, Bearer, 401→`SessionExpiredError`, 404→`LevelNotRegisteredError`, resto→`NetworkError`. Verificado contra el backend real.
  - `src/presentation/components/LeaderboardOverlay.tsx` \[NEW\] — 5 estados; 404 ≡ vacío en UI + `console.warn`; `currentRecord` destacado (o hint `noRecord`); tiempo con `formatDuration` (G3); alias sin traducir.
  - `src/presentation/game/LevelNodeCard.tsx` + `LevelSelectScreen.tsx` \[MOD\] — 🏆 en TODAS las cards (incl. bloqueadas, sin alert) con `stopPropagation` y `aria-label`.
  - `src/App.tsx` \[MOD\] — composition root (`GetLevelLeaderboard` + adapter), estado `leaderboardLevelId`, `key={levelId}`, CTA no-logueado → AccountOverlay.
  - `src/presentation/i18n/catalogs/{es,en}.ts` \[MOD\] — sección `leaderboard.*` (paridad).

- **Modificaciones manuales del equipo:**
  - Decisiones de diseño selladas en la parada: 🏆 también en bloqueadas (información social) · `currentRecord null` → hint sutil · `achievedAt` oculto en v1 · 404 ≡ vacío en UI hasta que el seed registre los niveles del mapa.
  - QA manual del flujo real (jugar → sync D2 → tabla) contra backend local con los 5 niveles del mapa registrados como datos locales.

- **Validación realizada:**
  - `npm test` → **527 tests / 64 suites** (base misión 1: 504/60 → **+23 tests, +4 suites**; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**; `eslint` → 0 en los archivos tocados.
  - E2E contra el backend real: `200 {topPlayers:[],currentRecord:null}` en nivel sin récords; `404` en nivel no registrado; QA visual de los 4 flujos aprobado.

#### 📋 Resumen de la sesión
Clasificación por nivel de punta a punta: puerto + DTOs + caso de uso en application, adapter Bearer con spec de contrato en infraestructura (fiel al backend real, verificado en código y en vivo), y un overlay de presentación con los cinco estados — incluida la sinergia con la cuenta (el leaderboard es EL motivo para loguearse) y la equivalencia visual 404≡vacío decidida por el gap del seed. Acceso vía 🏆 en cada card del mapa.

**Notas / follow-ups:**
- Rama `feat/leaderboards-cliente` APILADA sobre `feat/badge-usuario`; **PR no abierto**: cuando mergee el de la Misión 1 → `rebase --onto origin/dev feat/badge-usuario feat/leaderboards-cliente` + suite + `push --force-with-lease`.
- Id `2026-07-10-003` (renumerada desde `-002` al integrar el PR #44, que tomó ese id, durante el rebase sobre `dev`).
- Seed del backend con los 5 niveles del mapa → misión aparte en el repo del backend (regenerar `seeds/levels.seed.json`).
