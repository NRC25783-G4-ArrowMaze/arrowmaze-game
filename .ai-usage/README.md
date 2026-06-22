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

- **Total de reportes:** 19
- **Última actualización:** 2026-06-22
- **Suite de tests (actual):** 197/197 ✅ en 16 suites (tras corregir `__tests__/application/LevelDataBoardBuilder.spec.ts`)
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
