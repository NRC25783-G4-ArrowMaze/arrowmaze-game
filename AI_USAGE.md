# AI Usage — Arrow Maze Client

Resumen ejecutivo del uso de inteligencia artificial en este repositorio. El detalle
auditable —un reporte por sesión con el problema abordado, los prompts, el resultado,
las modificaciones manuales del equipo y las lecciones aprendidas— vive en
[`.ai-usage/`](./.ai-usage/README.md) (56+ reportes indexados en
[`manifest.json`](./.ai-usage/manifest.json)). La vista unificada de los tres repos del
proyecto está en la [vitácora de project-core](https://nrc25783-g4-arrowmaze.github.io/arrowmaze-project-core/bitacora.html).

## Herramientas utilizadas

| Herramienta | Modelos | Rol |
|---|---|---|
| **Claude Code** (CLI/IDE) | Sonnet 4.5 / 4.6, Opus 4.7 / 4.8, Haiku 4.5, Fable 5 | Diseño por capas, implementación TDD, refactors, reviews de PR |
| **Gemini** | 3.5 Flash | Tareas acotadas: fixes de compilación, documentación, features puntuales |
| **Cursor** (Cloud Agent) | — | Sesiones de implementación puntuales |

La metodología es **Specification-Driven Development**: las specs Gherkin se congelan en
[`arrowmaze-project-core`](https://github.com/NRC25783-G4-ArrowMaze/arrowmaze-project-core)
antes de implementar, y toda sesión de IA se documenta en `.ai-usage/` **antes del merge**
(regla del repo).

## Registro por tarea

Cada reporte de `.ai-usage/` registra: fecha, modelo y versión, problema abordado,
metodología/prompts, resultado, **modificaciones manuales del equipo** y lecciones.
Ejemplos representativos: [scaffold inicial](./.ai-usage/2026-06-01-initial-scaffold.md),
[motor de movimiento A3](./.ai-usage/2026-06-09-arrow-movement-engine.md),
[modo oscuro](./.ai-usage/2026-07-10-modo-oscuro.md).

## Evaluación crítica

- **Cobertura estimada:** ~80 % del código de producción se escribió con asistencia
  directa de IA (estimación del equipo), siempre en modalidad dirigida: el humano fija la
  spec, audita el diff y aprueba cada merge. Los tests (561) acompañaron cada feature vía TDD.
- **Trazabilidad:** el 100 % de las sesiones significativas tiene reporte en `.ai-usage/`.

## Alucinaciones y resultados incorrectos corregidos

| Caso | Cómo se detectó y corrigió |
|---|---|
| `tplant` + IA generaban PlantUML inválido (funciones standalone en el diagrama de clases) | El visor de PlantUML fallaba; se creó [`postprocess-uml.js`](./postprocess-uml.js) para sanear la salida (sesión 2026-06-02) |
| La IA propuso `process.env` en código de cliente Vite, forzando `@types/node` innecesarios | El build strict falló; se corrigió a `import.meta.env` nativo de Vite (sesión 2026-06-02) |
| Durante una auditoría, el asistente propuso **eliminar** archivos que en realidad había que refactorizar | El humano restauró los archivos y redirigió la sesión a refactorización (sesión 2026-06-02, cleanup feature 1) |
| Animación de movimiento con parámetros mal calibrados (salidas y choques) | Playtest humano; recalibración iterativa en PRs #42 y #44 |

## Reflexión del equipo

La IA aceleró de forma real la implementación (motor + UI + persistencia + producto en ~6
semanas) y elevó la calidad del diseño al obligar a explicitar decisiones antes de codificar
(SDD). Su límite claro: **no sustituye el criterio humano** — las correcciones de la tabla
anterior se detectaron por build, tests y playtest, no por la propia IA. La regla
"ninguna sesión sin reporte antes del merge" fue el mecanismo que mantuvo el uso de IA
auditable en lugar de opaco.
