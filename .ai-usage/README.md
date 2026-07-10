# AI Usage Registry — Arrow Maze Client

Registro centralizado de uso de herramientas de IA en el desarrollo del cliente web de **Arrow Maze**, en cumplimiento de las reglas del proyecto.

## Índice de reportes

| Fecha | Descripción | Archivo | Modelo |
|-------|-------------|---------|--------|
| 2026-06-01 | Initial Scaffold: Vite + React + TypeScript + Capacitor | [`2026-06-01-initial-scaffold.md`](./2026-06-01-initial-scaffold.md) | Claude Haiku 4.5 |
| 2026-06-01 | Domain Layer port-based + Infrastructure & Application Layer (It.1 + It.2) | [`2026-06-01-domain-infra-application-layer.md`](./2026-06-01-domain-infra-application-layer.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-02 | PlantUML Setup & Class Diagram Generation | [`2026-06-02-plantuml-setup.md`](./2026-06-02-plantuml-setup.md) | Gemini 3.5 Flash (Medium) |
| 2026-06-02 | Board Graph Engine — Architecture by Layer Documentation | [`2026-06-02-board-graph-architecture.md`](./2026-06-02-board-graph-architecture.md) | Claude Haiku 4.5 |
| 2026-06-02 | Auditoría, limpieza y refactorización — alineación con feature BDD | [`2026-06-02-cleanup-and-refactor-feature1.md`](./2026-06-02-cleanup-and-refactor-feature1.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-02 | Feature 1 Documentation: Board as Node Graph | [`2026-06-02-feature1.md`](./2026-06-02-feature1.md) | Gemini 3.5 Flash (Medium) |
| 2026-06-02 | TypeScript Strict Compilation & Vite Env Fixes | [`2026-06-02-fix-typescript-compilation.md`](./2026-06-02-fix-typescript-compilation.md) | Gemini 3.5 Flash (Low) |
| 2026-06-03 | Arrow Placement Feature Implementation | [`2026-06-03-arrow-placement-feature.md`](./2026-06-03-arrow-placement-feature.md) | Gemini 3.5 Flash (Low) |
| 2026-06-03 | ArrowSegment Domain Entity Redesign | [`2026-06-03-arrow-segment-redesign.md`](./2026-06-03-arrow-segment-redesign.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-04 | Propagación de refactor del dominio de ArrowSegment a aplicación e infra | [`2026-06-04-refactor-arrow-propagation.md`](./2026-06-04-refactor-arrow-propagation.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-09 | Arrow Movement Engine (Domain & Application) | [`2026-06-09-arrow-movement-engine.md`](./2026-06-09-arrow-movement-engine.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-12 | Complementar carpeta .claude con CLAUDE.md y comandos personalizados | [`2026-06-12-claude-folder-rules-complement.md`](./2026-06-12-claude-folder-rules-complement.md) | Claude Sonnet 4.6 |
| 2026-06-12 | Planning del Roadmap Maestro — Análisis de 13 features (A1–A5, B1–B3, C1–C4, D1–D2) | [`2026-06-12-master-roadmap-planning.md`](./2026-06-12-master-roadmap-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-12 | README.md del proyecto Arrow Maze — documentación real del repositorio | [`2026-06-12-master-roadmap-planning.md`](./2026-06-12-master-roadmap-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-13 | A4 — Game End Detection: GameSession + PlayMoveUseCase | [`2026-06-13-game-end-detection-a4.md`](./2026-06-13-game-end-detection-a4.md) | Claude Sonnet 4.6 |
| 2026-06-14 | A5 — Game Session Scoring: Planning | [`2026-06-14-game-session-scoring-a5-planning.md`](./2026-06-14-game-session-scoring-a5-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-14 | A5 — Game Session Scoring: Evaluation & Implementation | [`2026-06-14-game-session-scoring-evaluation-implementation.md`](./2026-06-14-game-session-scoring-evaluation-implementation.md) | Claude Opus 4.8 (evaluation) + Sonnet 4.6 (impl init) + Haiku 4.5 (impl final) |
| 2026-06-15 | Motor de Juego: Constructores de Tablero y Flechas (Frontend) | [`2026-06-15-level-load.md`](./2026-06-15-level-load.md) | Gemini (versión no especificada) |
| 2026-06-22 | Validación PR #10 + saneo registro AI usage + spec movimiento continuo | [`2026-06-22-pr10-validation-ai-usage-cleanup.md`](./2026-06-22-pr10-validation-ai-usage-cleanup.md) | Claude Opus 4.8 |
| 2026-06-26 | Planning de fixes de movimiento — FIX-1 (slide, aplicación) + FIX-2 (colisión de cola, dominio) | [`2026-06-26-movement-fixes-planning.md`](./2026-06-26-movement-fixes-planning.md) | Claude Opus 4.8 |
| 2026-06-26 | FIX-1 slide-arrow-movement — implementación de SlideArrowUseCase (aplicación) | [`2026-06-26-slide-arrow-movement-impl.md`](./2026-06-26-slide-arrow-movement-impl.md) | Claude Opus 4.8 |
| 2026-06-26 | FIX-2 tail-collision-detection — validación del destino de la cola en Arrow.advance (dominio) | [`2026-06-26-tail-collision-detection-impl.md`](./2026-06-26-tail-collision-detection-impl.md) | Claude Opus 4.8 |
| 2026-06-27 | Animación de slide tick-a-tick + recoil de colisión (presentación) | [`2026-06-27-slide-animation-recoil-presentation.md`](./2026-06-27-slide-animation-recoil-presentation.md) | Claude Sonnet 4.6 + Claude Opus 4.8 |
| 2026-06-27 | Mapa de preview "corazón": tablero-grafo esquemático y resoluble | [`2026-06-27-heart-preview-map.md`](./2026-06-27-heart-preview-map.md) | Claude Opus 4.8 |
| 2026-06-27 | Animaciones desaparición, deformación colisión, UI mejorado | [`2026-06-27-animaciones-desaparicion-deformacion-ui.md`](./2026-06-27-animaciones-desaparicion-deformacion-ui.md) | Claude Haiku 4.5 + Opus 4.8 |
| 2026-06-27 | Persistencia local del progreso (Offline-First, SQLite + sync bidireccional) | [`2026-06-27-progreso-local.md`](./2026-06-27-progreso-local.md) | Gemini (versión no especificada) |
| 2026-06-28 | Colisión configurable (return por defecto) + mapa decorado 6×6 | [`2026-06-28-colision-return-y-mapa-decorado.md`](./2026-06-28-colision-return-y-mapa-decorado.md) | Claude Opus 4.8 |
| 2026-07-03 | Pulido visual de animaciones: glide entre ticks, recoil asimétrico, burst orgánico, fractura de punta | [`2026-07-03-pulido-visual-animaciones.md`](./2026-07-03-pulido-visual-animaciones.md) | Claude Fable 5 |
| 2026-07-03 | Auditoría del repo: reglas sincronizadas y tooling corregido | [`2026-07-03-analisis-repo-sync-reglas-tooling.md`](./2026-07-03-analisis-repo-sync-reglas-tooling.md) | Claude Fable 5 |
| 2026-07-04 | Resolución de conflictos PR #16 + matriz de decisiones de merge | [`2026-07-04-resolucion-conflictos-pr16.md`](./2026-07-04-resolucion-conflictos-pr16.md) | Claude Fable 5 + Haiku 4.5 |
| 2026-07-08 | Follow-up fixes del PR #30 (login-service): NetworkError guard, test infra, nits EOF | [`2026-07-08-pr30-login-service-followup.md`](./2026-07-08-pr30-login-service-followup.md) | Claude Opus 4.6 (Thinking) |
| 2026-07-08 | Diagnóstico y fix: progreso perdido al volver al mapa tras avanzar de nivel (post v0.1.2) | [`2026-07-08-fix-avance-siguiente-nivel-progreso-perdido.md`](./2026-07-08-fix-avance-siguiente-nivel-progreso-perdido.md) | Claude Sonnet 5 |
| 2026-07-08 | Quitar el botón "Volver" redundante del header de partida | [`2026-07-08-fix-boton-volver-header-redundante.md`](./2026-07-08-fix-boton-volver-header-redundante.md) | Claude Sonnet 5 |
| 2026-07-08 | Fix del bug de ruta del login en PR #30 (`/api/v1/auth/login`) + corrección de su test | [`2026-07-08-fix-ruta-login-v1.md`](./2026-07-08-fix-ruta-login-v1.md) | Claude Opus 4.8 (1M context) |
| 2026-07-08 | G2: Internacionalización ES/EN (catálogos, motor, cambio en caliente, selector) | [`2026-07-08-g2-internacionalizacion.md`](./2026-07-08-g2-internacionalizacion.md) | Claude Opus 4.8 (1M context) |
| 2026-07-08 | G3: Temporizador de nivel (IClock inyectable, mm:ss, congela en pausa) | [`2026-07-08-g3-temporizador-nivel.md`](./2026-07-08-g3-temporizador-nivel.md) | Claude Opus 4.8 (1M context) |
| 2026-07-09 | G1: Audio (SFX por outcome + música por dificultad, mute/volúmenes, créditos) | [`2026-07-09-g1-audio-sfx-musica.md`](./2026-07-09-g1-audio-sfx-musica.md) | Claude Opus 4.8 (1M context) |
| 2026-07-09 | E: UI de Cuenta (login/registro/logout, validación E1, overlay + i18n) | [`2026-07-09-e-ui-cuenta.md`](./2026-07-09-e-ui-cuenta.md) | Claude Opus 4.8 (1M context) |
| 2026-07-09 | Fix: ruta del adapter de progreso a `/api/v1/progress` (sync D2 daba 404) | [`2026-07-09-fix-ruta-progress-v1.md`](./2026-07-09-fix-ruta-progress-v1.md) | Claude Opus 4.8 (1M context) |
| 2026-07-09 | Reducir el glifo de las flechas al 55% con escala unificada (`ARROW_SCALE` + `ARROW_GLYPH`) | [`2026-07-09-fix-tamano-flechas.md`](./2026-07-09-fix-tamano-flechas.md) | Claude Opus 4.8 (1M context) |
| 2026-07-09 | Animación de flechas: glide sobre riel persistente, orientación en reposo, salida voladora, recalibración del choque | [`2026-07-09-animacion-flechas.md`](./2026-07-09-animacion-flechas.md) | Claude Opus 4.8 (1M context) |
| 2026-07-10 | Badge de usuario logueado en el header (alias del email, sobrevive F5) | [`2026-07-10-badge-usuario.md`](./2026-07-10-badge-usuario.md) | Claude Opus 4.8 (1M context) |
| 2026-07-10 | Follow-ups de #42 (salida fantasma, `useId`, `onDone`, perf del riel) + saneo de lint de `dev` (#45) en el PR #44 | [`2026-07-10-pr44-followups-42-lint-45.md`](./2026-07-10-pr44-followups-42-lint-45.md) | Claude Opus 4.8 |
| 2026-07-10 | Leaderboards en el cliente: clasificación por nivel (🏆 en cards, overlay 5 estados) | [`2026-07-10-leaderboards-cliente.md`](./2026-07-10-leaderboards-cliente.md) | Claude Opus 4.8 (1M context) + Fable 5 |
| 2026-07-10 | Toast de sesión: bienvenida al login y cierre automático del overlay (simetría en logout) | [`2026-07-10-login-bienvenida.md`](./2026-07-10-login-bienvenida.md) | Claude Fable 5 |
| 2026-07-10 | Checklist de verificación v1.0.0 + sincronización de docs desfasadas (README/FEATURES.md) | [`2026-07-10-verification-checklist-v1.md`](./2026-07-10-verification-checklist-v1.md) | Claude Opus 4.8 (1M context) |
| 2026-07-10 | LICENSE, CHANGELOG, bump de versión y GoF/SOLID en README | [`2026-07-10-release-scaffolding-gof-solid.md`](./2026-07-10-release-scaffolding-gof-solid.md) | Claude Opus 4.8 (1M context) |
| 2026-07-10 | Push y apertura del PR #48 (checklist + scaffolding de release) | [`2026-07-10-pr48-checklist-release-scaffolding.md`](./2026-07-10-pr48-checklist-release-scaffolding.md) | Claude Opus 4.8 (1M context) |
| 2026-07-10 | Higiene del sync: scheduler single-flight con gate de sesión (login+victoria coordinados) | [`2026-07-10-higiene-sync.md`](./2026-07-10-higiene-sync.md) | Claude Fable 5 |

> ⚠️ **Inconsistencia heredada:** la entrada `2026-06-02-board-graph-architecture.md` figura en `manifest.json` pero su archivo no existe en disco. Conviene restaurar el archivo o retirar la entrada del manifest en una limpieza posterior.

---

## Formato de reportes

Cada entrada en este registro sigue el formato estándar:

```markdown
### YYYY-MM-DD — <Resumen de la tarea>
- **Herramienta:** <Cursor / Claude / GPT / Copilot / etc.>
- **Modelo / versión:** <si se conoce>
- **Autor humano responsable:** <nombre o handle>
- **Prompt(s) representativo(s):**
  - "..."
- **Salida tomada de la IA:** <archivos / bloques principales generados>
- **Modificaciones manuales del equipo:** <qué se ajustó, por qué>
- **Validación realizada:** <tests, lint, revisión humana>
```

---

## Estadísticas

- **Total de reportes:** 52
- **Última actualización:** 2026-07-10
- **Suite de tests (actual):** 544/544 ✅ en 66 suites
- **Requisito crítico:** scoring 100% RAM-resident (sin persistencia agregada)
- **Detalle por herramienta/modelo:** ver `manifest.json` (`aiUsageRegistry.statistics`) como fuente estructurada de verdad.

---

## Reglas para contribuidores

Al agregar IA assistance a este proyecto:

1. ✅ **Crear un nuevo reporte** en esta carpeta (naming: `YYYY-MM-DD-descripcion.md`)
2. ✅ **Registrar el archivo** en este INDEX (`README.md`)
3. ✅ **Actualizar** `manifest.json` (array `entries` + `statistics`)
4. ✅ **Incluir metadata completa:** herramienta, modelo, autor, prompts, salida, validación
5. ✅ **Commitearlo junto** con el código generado y referenciarlo en el PR

---

> Para más contexto sobre las reglas del proyecto, consulta [`CONTRIBUTING.md`](../CONTRIBUTING.md) y [`.cursor/rules/`](../.cursor/rules/).
