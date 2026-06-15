# AI Usage Registry — Arrow Maze Client

Registro centralizado de uso de herramientas de IA en el desarrollo del cliente web de **Arrow Maze**, en cumplimiento de las reglas del proyecto.

## Índice de reportes

| Fecha | Descripción | Archivo | Modelo |
|-------|-------------|---------|--------|
| 2026-06-01 | Bootstrap del proyecto (Vite + React + TypeScript + Capacitor, estructura de carpetas, dominio DDD inicial) | [`2026-06-01-initial-scaffold.md`](./2026-06-01-initial-scaffold.md) | Claude Haiku 4.5 |
| 2026-06-01 | Capa de Dominio basada en puertos e Infraestructura/Aplicación (TDD) | [`2026-06-01-domain-infra-application-layer.md`](./2026-06-01-domain-infra-application-layer.md) | Claude Sonnet 4.6 |
| 2026-06-02 | Configuración de PlantUML y generador de diagramas de clase | [`2026-06-02-plantuml-setup.md`](./2026-06-02-plantuml-setup.md) | Gemini 3.5 Flash |
| 2026-06-03 | Implementación de la funcionalidad de colocación de flechas (Arrow Placement) | [`2026-06-03-arrow-placement-feature.md`](./2026-06-03-arrow-placement-feature.md) | Gemini 3.5 Flash (Low) |
| 2026-06-03 | Rediseño del modelo de ArrowSegment para corregir inconsistencias | [`2026-06-03-arrow-segment-redesign.md`](./2026-06-03-arrow-segment-redesign.md) | Claude Sonnet 4.6 |
| 2026-06-04 | Propagación del refactor del dominio de ArrowSegment a aplicación e infra | [`2026-06-04-refactor-arrow-propagation.md`](./2026-06-04-refactor-arrow-propagation.md) | Claude Sonnet 4.6 |
| 2026-06-12 | Complementar carpeta .claude con CLAUDE.md y comandos personalizados | [`2026-06-12-claude-folder-rules-complement.md`](./2026-06-12-claude-folder-rules-complement.md) | Claude Sonnet 4.6 |
| 2026-06-12 | Planning del roadmap maestro: análisis de 13 features (A1–A5, B1–B3, C1–C4, D1–D2), 5 fases, 7 open questions | [`2026-06-12-master-roadmap-planning.md`](./2026-06-12-master-roadmap-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-12 | README.md del proyecto: reemplaza template Vite por documentación real (arquitectura, features, comandos) | [`2026-06-12-master-roadmap-planning.md`](./2026-06-12-master-roadmap-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-13 | Implementación de GameSession (aggregate root) y PlayMoveUseCase (A4 — detección de fin de partida) | [`2026-06-13-game-end-detection-a4.md`](./2026-06-13-game-end-detection-a4.md) | Claude Sonnet 4.6 |
| 2026-06-14 | Planning A5 — Scoring: ScoringConstants VO, ScoringTracker, Score VO, integración en GameSession y PlayMoveUseCase | [`2026-06-14-game-session-scoring-a5-planning.md`](./2026-06-14-game-session-scoring-a5-planning.md) | Claude Sonnet 4.6 (Thinking) |
| 2026-06-14 | Evaluación e implementación sistema scoring de GameSession (addendum + 71 tests, 0 regresiones) | [`2026-06-14-game-session-scoring-evaluation-implementation.md`](./2026-06-14-game-session-scoring-evaluation-implementation.md) | Claude Opus 4.8 + Sonnet 4.6 + Haiku 4.5 |

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

- **Total de reportes:** 12
- **Última actualización:** 2026-06-14
- **Modelos usados:** Claude Haiku 4.5 (2), Claude Opus 4.8 (1), Claude Sonnet 4.6 (6), Claude Sonnet 4.6 Thinking (3), Gemini 3.5 Flash (2), Copilot (1)
- **Herramientas:** GitHub Copilot (1), Antigravity (Gemini / Claude) (5), Antigravity (Claude) (3), Claude Code (3)
- **Tests nuevos:** 71 (game-session-scoring); histórico total 214 tests ✅
- **Requisito crítico:** scoring 100% RAM-resident (no persistencia agregada) ✅

---

## Reglas para contribuidores

Al agregar IA assistance a este proyecto:

1. ✅ **Crear un nuevo reporte** en esta carpeta (naming: `YYYY-MM-DD-descripcion.md`)
2. ✅ **Registrar el archivo** en este INDEX (`README.md`)
3. ✅ **Incluir metadata completa:** herramienta, modelo, autor, prompts, salida, validación
4. ✅ **Commitearlo junto** con el código generado
5. ✅ **Abrir PR** con referencia a este reporte

---

> Para más contexto sobre las reglas del proyecto, consulta [`CONTRIBUTING.md`](../CONTRIBUTING.md) y [`.cursor/rules/`](../.cursor/rules/).
