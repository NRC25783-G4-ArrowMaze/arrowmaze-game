# ✅ Verification Checklist — Arrow Maze Client (v1.0.0)

> Documento de verificación y estado de cumplimiento de cara al release **v1.0.0** de `arrowmaze-game`.
> **Última actualización:** 2026-07-10 (revisión completa del código en rama `dev`)
> **Cliente:** `arrowmaze-game` · **Backend:** `arrowmaze-backend` (ya congelado en v1.0.0)
> **Rama evaluada:** `dev` (20 commits por delante de `main`; `main` en tag `v0.1.2`)

> ✅ **Nota de sincronización (actualizada 2026-07-10):** La matriz de features de
> `arrowmaze-project-core/docs/FEATURES.md` y la sección "Features" del `README.md` de este repo
> **ya fueron corregidas** en esta misma rama para reflejar el estado real de `dev`: G1–G3, F4
> (leaderboard), C3, D1 y D2 pasaron de "pendiente"/"spec lista" a ✅ Implementado, y se resolvieron
> P20 y P21 en `FEATURES.md`. El `BORRADOR-features-pendientes.md` de project-core quedó marcado
> como cerrado/histórico. Solo siguen abiertos: P23 (integración tiempo→score, G3) y la ausencia de
> una pantalla de Inicio dedicada (C4).

---

## Resumen ejecutivo

| Categoría | Estado | Completitud |
|-----------|--------|-------------|
| 1. Repositorios & Git | 🟢 Implementado | ~90% |
| 2. Principios SOLID | 🟡 Parcial | ~80% |
| 3. Patrones GoF | 🟢 Implementado (código) | ~85% |
| 4. Arquitectura Hexagonal / CLEAN | 🟢 Implementado | ~95% |
| 5. Pruebas & CI/CD | 🟡 Parcial | ~70% |
| 6. Diagramas | 🟡 Parcial | ~50% |
| 7. Motor y jugabilidad | 🟢 Implementado | ~90% |
| 8. Producto (audio / i18n / timer) + grupos A–H | 🟢 Implementado | ~90% |
| 9. Integración con backend (auth / sync / leaderboard) | 🟢 Implementado | ~90% |
| 10. README.md | 🟡 Parcial | ~65% |
| 11. AI_USAGE / `.ai-usage` | 🟢 Implementado | ~90% |
| 12. Entregables de release (v1.0.0) | 🔴 Pendiente | ~20% |

---

## 1. 📦 Repositorios & Git

### Criterios requeridos
- [x] Repositorio **Cliente** (`arrowmaze-game`) en GitHub
- [x] Uso de **Pull Requests** — ✅ confirmado (merges #28–#46 recientes)
- [x] **Conventional Commits** — ✅ mayormente (`feat(...)`, `fix(...)`, `style(...)`, `docs:`)
- [ ] Ramas protegidas (`main` y `dev`) — ⚠️ verificar en GitHub Settings
- [ ] `dev` mergeado a `main` para el release — ❌ pendiente (20 commits sin promover)

### Evidencia encontrada
```
061577af feat(leaderboard): tabla de clasificación por nivel (cliente) (#46)
4c6bd792 feat(auth): badge de usuario en el header (alias del email) (#43)
2f7a2636 fix(board): animación del movimiento — riel persistente… (#42)
8daae618 feat(auth): UI de cuenta — login, registro y logout (grupo E cliente) (#38)
0d0af4fd feat(audio): SFX y música por dificultad (G1) (#37)
4891290f feat(timer): temporizador de nivel (G3) (#36)
```
- Tags existentes: `v0.1.0`, `v0.1.1`, `v0.1.2`. `main` en `v0.1.2` (nota: el reporte inicial
  mencionaba v0.1.1; el tag actual de `main` es **v0.1.2**).
- Rama de trabajo: `dev` (no `develop`, a diferencia del backend).

### ⚠️ Issues detectados
- `dev` diverge de `main` en **20 commits** con todo el trabajo de producto (leaderboard, auth/UI,
  i18n, audio, timer, animaciones, fixes de rutas API).
- El salto de versión hasta v1.0.0 es grande (`0.1.2` → `1.0.0`).

### 🎯 Acciones pendientes
- [ ] Confirmar Branch Protection Rules en GitHub (`main`, `dev`)
- [ ] Planificar la promoción `dev → main` (PR de release) — fase posterior

---

## 2. 🔷 Principios SOLID

### Criterios requeridos
- [x] **S / O / L / I / D** evidenciados en el código
- [ ] Cada principio documentado en el **README** con ejemplos específicos

### Evidencia encontrada en código

| Principio | Archivo(s) clave | Verificado |
|-----------|-----------------|-----------|
| **S** | Casos de uso de una sola responsabilidad: `PlayMoveUseCase`, `SaveLocalProgress`, `LevelLoader` | ✅ |
| **O** | `InMemoryLevelRepository` implementa `ILevelRepository`; nuevos builders vía `IArrowBuilder`/`IBoardBuilder` sin tocar dominio | ✅ |
| **L** | Adapters `Fetch*ApiClient` sustituibles tras los puertos `I*ApiClient` | ✅ |
| **I** | Puertos finos y segregados en `src/application/ports/` (11 interfaces: `IClock`, `IAudioPreferences`, `IAuthApiClient`, `ILocalProgressRepository`, …) | ✅ |
| **D** | Los casos de uso dependen de puertos (`I*`), las implementaciones concretas se inyectan (p. ej. `LocalProgressModuleFactory`) | ✅ |

### ⚠️ Issues detectados
- SOLID **no está documentado en el README** con snippets reales.

### 🎯 Acciones pendientes
- [ ] Añadir sección SOLID en el README con fragmentos de código reales del cliente

---

## 3. 🏭 Patrones GoF

### Criterios requeridos
- [x] **Patrón Creacional** implementado
- [x] **Patrón Estructural** implementado
- [x] **Patrón de Comportamiento** implementado
- [ ] Justificación y fragmentos de código en el **README**

### Evidencia encontrada

| Patrón | Tipo | Archivo(s) | Estado |
|--------|------|-----------|--------|
| **Factory Method** | Creacional | `src/infrastructure/factories/LocalProgressModuleFactory.ts` | ✅ |
| **Builder** | Creacional | `IArrowBuilder`/`IBoardBuilder` → `LevelDataArrowBuilder`, `LevelDataBoardBuilder` (`src/application/services/`) | ✅ |
| **Adapter** | Estructural | `FetchAuthApiClient`, `FetchLevelApiClient`, `FetchProgressApiClient`, `FetchLeaderboardApiClient` (adaptan `fetch`/axios al puerto); `CapacitorAudioPreferences`, `CapacitorLanguagePreference` (adaptan Capacitor) | ✅ |
| **State / Pushdown Automaton** | Comportamiento | `src/application/services/GameFlowController.ts` (pila `ACTIVE/PAUSED/SETTINGS`, C1) | ✅ |
| **Ports & Adapters (arquitectónico)** | — | 11 puertos en `src/application/ports/` + adapters en `infrastructure/` | ✅ |

### ⚠️ Issues detectados
- Los patrones **están en el código** pero **no documentados con terminología GoF** en el README.

### 🎯 Acciones pendientes
- [ ] Añadir sección `## Design Patterns (GoF)` al README con Factory, Builder, Adapter y State + snippets

---

## 4. 🏗️ Arquitectura Hexagonal / CLEAN

### Criterios requeridos
- [x] Capas concéntricas con Regla de Dependencia hacia el dominio
- [x] Dominio aislado (sin dependencias de framework)
- [x] Casos de uso en Application; adaptadores en Infrastructure; UI en Presentation
- [ ] Diagrama de capas embebido en README

### Estructura verificada

```
src/
├── domain/          ✅ entities (Arrow, Board, Cell, GameSession, LevelProgress…),
│                       value-objects (Score, ScoringTracker, Port…),
│                       repositories (ILevelRepository), services (PathChecker,
│                       TopologyValidator, LevelSelectionProjection)
├── application/     ✅ use-cases (PlayMove, PlaceArrow, SlideArrow, LevelLoader,
│                       Save/GetLocalProgress, SyncProgress, SyncOfflineProgress…),
│                       services (GameFlowController, LoginUser, RegisterUser,
│                       GetLevelLeaderboard…), ports/ (11 interfaces), dtos, errors
├── infrastructure/  ✅ api/ (Fetch*ApiClient), repositories, persistence/sqlite,
│                       audio, i18n, auth, factories, config, time
└── presentation/    ✅ game/, components/ (Board, Cell, Arrow, overlays…),
                        rendering, animation, input, account, audio, i18n, forge, preview
```

### ⚠️ Issues detectados
- No hay un **diagrama de capas** visual embebido en el README (sí existe `classes.puml`).

### 🎯 Acciones pendientes
- [ ] Generar/exportar diagrama de capas y embeberlo en el README

---

## 5. 🧪 Pruebas & CI/CD

### Criterios requeridos
- [x] Pruebas unitarias (dominio, aplicación, infraestructura, presentación)
- [ ] **CI/CD con GitHub Actions** que ejecute build + tests en cada PR — ❌ **NO existe**

### Estado de tests (verificado con `pnpm test`)
```
Test Suites: 64 passed, 64 total
Tests:       531 passed, 531 total
Time:        ~4.3 s
```
- 64 archivos `*.spec.ts(x)` en `__tests__/` por capa (dominio: grafo/flechas/colisión/scoring;
  aplicación: login/registro/sync/leaderboard/level loader; infraestructura: adapters API/sqlite;
  presentación: i18n/timer/audio/overlays).

### ⚠️ Issues detectados — CRÍTICO
- **NO existe `.github/workflows/`** — no hay CI configurada (a diferencia del backend, que sí tiene `ci.yml`).

### 🎯 Acciones pendientes — ALTA PRIORIDAD
- [ ] Crear `.github/workflows/ci.yml` (trigger PR/push → `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm test`); considerar añadir `pnpm lint` (el script existe)

---

## 6. 📊 Diagramas

### Criterios requeridos
- [x] **Diagrama de Clases** — `classes.puml` (690 líneas, generable con `pnpm gen-uml`)
- [ ] **Diagrama de Capas** — no existe como artefacto dedicado
- [ ] Diagramas **embebidos en el README** como imágenes

### Estado actual

| Diagrama | Archivo | En README | Completo |
|----------|---------|-----------|---------|
| Clases | `classes.puml` | ❌ | 🟡 verificar cobertura |
| Capas | — | ❌ | ❌ |

### 🎯 Acciones pendientes
- [ ] Ejecutar `pnpm gen-uml` y verificar cobertura de `classes.puml`
- [ ] Exportar a imagen (PNG/SVG) y embeber en README
- [ ] Crear diagrama de capas hexagonales

---

## 7. 🎮 Motor y jugabilidad

### Criterios requeridos
- [x] Motor de tablero como grafo (A1), colocación de flechas (A2), movimiento (A3)
- [x] Detección de fin de partida: victoria/derrota (A4)
- [x] Puntuación por sesión (A5) — `Score`, `ScoringTracker`, `ScoringConstants`
- [x] Renderizado SVG (B1), animaciones (B2), enrutamiento de input (B3)
- [x] Pantallas de soporte: overlays de fin, pausa, ajustes (`GameOverlay`, `PauseOverlay`, `SettingsOverlay`)
- [ ] **15+ niveles** — ⚠️ **solo 5 niveles locales** (`levelAdvanced`, `levelExpert`, `levelIntermediateB`, `sampleLevel`, `sampleLevel2`)

### Evidencia
- `src/domain/entities/` y `src/domain/value-objects/` cubren el modelo completo.
- `src/presentation/components/`: `BoardComponent`, `CellComponent`, `ArrowComponent`, animaciones
  (`ArrowBurst`, `ArrowExit`, `ArrowHeadDisintegrate`), overlays.
- `src/presentation/game/levels/`: 5 definiciones + `localLevels.ts` (agregador) + `buildLevelData.ts`.

### ⚠️ Issues detectados
- **Conteo de niveles (5) por debajo del mínimo histórico de 15+** — decidir si el requisito aplica
  al cliente offline o se cubre vía distribución remota (F2/backend seed).

### 🎯 Acciones pendientes
- [ ] Confirmar el requisito de nº de niveles para v1.0.0 y, si aplica, ampliar el set

---

## 8. 🎁 Producto (audio / i18n / timer) + estado por grupo A–H

### Criterios requeridos
- [x] **Audio** (G1): SFX + música por dificultad, con preferencia de silencio
  (`infrastructure/audio/CapacitorAudioPreferences.ts`, `presentation/audio/`, `useGameAudio.ts`)
- [x] **i18n** (G2): catálogos `es`/`en` con test de paridad, cambio en caliente, selector en ajustes
  (`presentation/i18n/catalogs/{es,en}.ts`, `I18nContext`, `CapacitorLanguagePreference`)
- [x] **Timer** (G3): temporizador por nivel (mm:ss) con `IClock` (`levelTimer.ts`, `useLevelTimer`, `LevelTimerDisplay`)

### Estado real por grupo (código en `dev`)

| Grupo | Descripción | Estado real |
|-------|-------------|-------------|
| A | Motor de juego (A1–A5) | ✅ Implementado |
| B | Render / presentación (B1–B3) | ✅ Implementado (SVG) |
| C | Flujo y estados (C1 FSM, C2 carga, C3 selección, C4 pantallas) | ✅ C1/C2/C3; ⚠️ C4 parcial (sin pantalla de Inicio dedicada) |
| D | Persistencia local (D1 SQLite, D2 sync) | ✅ Implementado — D1 lectura wired vía `App.tsx`→`LevelSelectScreen`; D2 conflictos resueltos (`isBeatenBy`, P21) |
| E | Identidad y sesión (login/registro/logout UI) | ✅ Implementado (#38, #43); E2 sin flujo de refresh de JWT |
| F | Backend / API + leaderboard (F4) | ✅ Consumido desde cliente (leaderboard #46, por nivel — P20 resuelto) |
| G | Producto (G1 audio, G2 i18n, G3 timer) | ✅ G1/G2 implementados; ⚠️ G3 visual implementado, integración con score pendiente (P23) |
| H | FORGE editor (H1) | ✅ Implementado (Fases 0–6) |

### 🎯 Acciones pendientes
- [x] Actualizar la tabla de features del README y de `project-core/FEATURES.md` al estado real — hecho en esta rama
- [ ] Cerrar P23 (mecanismo de integración timer→score en A5)
- [ ] Decidir si se construye una pantalla de Inicio dedicada (C4) o se mantiene el selector de niveles como entrada

---

## 9. 🌐 Integración con backend

### Criterios requeridos
- [x] **Auth JWT** — `FetchAuthApiClient`, `LoginUser`/`RegisterUser`/`LogoutUser`, badge de usuario
- [x] **Sync de progreso** — `FetchProgressApiClient` sobre `/api/v1/progress` (#39), `SyncProgress`/`SyncOfflineProgress`
- [x] **Niveles remotos** — `FetchLevelApiClient` (F2, fallback offline)
- [x] **Leaderboard** — `FetchLeaderboardApiClient`, `GetLevelLeaderboard`, `LeaderboardOverlay` (#46)

### ⚠️ Issues detectados
- Rutas de API estabilizadas recientemente (`/api/v1/auth/login` #33, `/api/v1/progress` #39) — verificar consistencia total en `infrastructure/config`.

### 🎯 Acciones pendientes
- [ ] Prueba de humo end-to-end cliente↔backend antes del release

---

## 10. 📖 README.md

### Criterios requeridos
- [x] Descripción, Stack, Arquitectura, Conceptos de dominio, Tests, Comandos
- [x] Sección de Features — **ya actualizada** en esta rama al estado real
- [ ] SOLID con snippets · GoF · (AOP N/A en cliente) documentados
- [ ] Diagramas embebidos como imágenes
- [ ] Sección **Licencia** apunta a un archivo `LICENSE` (que **no existe**)

### ⚠️ Issues detectados
- Faltan secciones GoF/SOLID con snippets y diagramas embebidos.
- La sección "Licencia" existe en texto pero **no hay archivo `LICENSE`**.

### 🎯 Acciones pendientes
- [x] Actualizar estados de features (G, F4, C/D) al real — hecho en esta rama
- [ ] Añadir GoF + SOLID con snippets y embeber diagramas
- [ ] Alinear la sección Licencia con un `LICENSE` real

---

## 11. 🤖 AI_USAGE / `.ai-usage`

### Criterios requeridos
- [x] Registro modular de uso de IA por tarea (`.ai-usage/` con ~48 sesiones + `manifest.json` + `README.md`)
- [x] Reporte consolidado (`doc/ai-usage-report.md`)
- [ ] Archivo `AI_USAGE.md` en la **raíz** (el requisito especifica ese nombre) — ❌ no existe

### 🎯 Acciones pendientes
- [ ] Verificar si `.ai-usage/README.md` + `doc/ai-usage-report.md` cumplen, o crear `AI_USAGE.md` en raíz
- [ ] Confirmar que incluye evaluación crítica del impacto de la IA

---

## 12. 📬 Entregables de release (v1.0.0)

### Criterios requeridos
- [ ] `CHANGELOG.md` — ❌ no existe
- [ ] `LICENSE` — ❌ no existe
- [ ] CI (`.github/workflows/ci.yml`) — ❌ no existe
- [ ] Bump de versión `0.1.2` → `1.0.0` en `package.json`
- [ ] Promoción `dev → main` (PR de release) + tag `v1.0.0`
- [ ] GitHub **Release** con **APK** funcional (Capacitor `build:apk` + `android/`)
- [x] Build de APK disponible (`pnpm build:apk`, `capacitor.config.ts`, carpeta `android/`)

### 🧹 Residuos a limpiar
- [ ] `manifest.json.tmp` (archivo vacío en raíz)
- [ ] `package-lock.json` coexistiendo con `pnpm-lock.yaml` (el gestor es pnpm)

### 🎯 Acciones pendientes
- [ ] Crear `LICENSE`, `CHANGELOG.md`, `ci.yml`
- [ ] Decidir y aplicar el salto de versión a `1.0.0`
- [ ] Generar APK y adjuntarlo al GitHub Release

---

## 🗺️ Roadmap de acciones priorizadas

> ✅ = ya implementado en código · ⬜ = pendiente

### 🔴 CRÍTICO — Infraestructura de release (código listo, falta scaffolding)
1. ⬜ **CI/CD**: `.github/workflows/ci.yml` (install → build → test) — no existe
2. ⬜ **LICENSE**: crear archivo (la sección del README lo referencia pero no existe)
3. ⬜ **CHANGELOG.md**: crear con el historial hasta v1.0.0
4. ⬜ **Bump de versión**: `package.json` `0.1.2` → `1.0.0`

### 🟡 IMPORTANTE — Documentación
5. ✅ **Actualizar features** en README y `project-core/FEATURES.md` al estado real (G, F4, C/D) — hecho en esta rama
6. ⬜ **GoF + SOLID** en README con snippets; embeber diagramas
7. ⬜ **AI_USAGE.md** en raíz (o validar que lo existente cumple)

### 🟢 COMPLETAR — Antes de la entrega
8. ⬜ **Promoción `dev → main`**: PR de release + merge + tag `v1.0.0`
9. ⬜ **GitHub Release** con APK funcional (`pnpm build:apk`)
10. ⬜ **Niveles**: confirmar requisito de cantidad (hoy 5 locales) y limpiar residuos (`manifest.json.tmp`, `package-lock.json`)

---

*Última revisión: 2026-07-10 — código en `dev` verificado (531 tests / 64 suites en verde). Los patrones GoF, la arquitectura hexagonal, el grupo G (audio/i18n/timer) y el leaderboard están implementados; falta la infraestructura de release (CI/LICENSE/CHANGELOG), el bump de versión y la promoción a `main`.*
