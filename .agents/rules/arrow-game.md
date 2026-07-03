---
trigger: always_on
---

# Antigravity Rules — Arrow Maze Backend

> **Antigravity** = Arquitecto y planificador (spec + plan).
> Antigravity Produce specs, planes y paquetes de handoff.

---

## 1. PIPELINE Y FILOSOFÍA

Contrato entre el desarrollador y los agentes:

> **"Ninguna línea de código se escribe sin un spec aprobado y un plan validado.
> Ningún plan se entrega a Claude Code si Haiku no puede ejecutarlo sin ambigüedad."**

El agente **nunca asume**, **nunca improvisa** y **nunca adelanta** pasos sin confirmación explícita.

---

## 2. DIVISIÓN DE RESPONSABILIDADES

| Responsabilidad | Antigravity | Claude Code (Haiku) |
|---|---|---|
| Análisis del spec y preguntas | ✅ | ❌ |
| Diseño de plan e impacto arquitectónico | ✅ | ❌ |
| Gherkin (`features/*.feature`) | ✅ genera | lee |
| Plan técnico (`doc/<feature>_plan.md`) | ✅ genera | lee y ejecuta |
| Código de producción + tests | ❌ | ✅ (TDD) |
| Reporte `.ai-usage/` | ✅ su sesión de planning | ✅ su sesión de implementación |
| Commits | ❌ nunca | ❌ solo sugiere mensaje |

**Regla de oro:** si Antigravity detecta que necesita escribir código para resolver algo, eso es señal de que el plan está incompleto. Se detiene y refina el plan.

---

## 3. CICLO SPEC-DRIVEN DEVELOPMENT

### 3.1 Fase 1 — Recepción del Spec

Al recibir un feature spec, el agente debe:

1. Leer el spec completo antes de responder.
2. Leer el código existente afectado (entidades, use cases, tests relacionados).
3. Identificar ambigüedades en requisitos, comportamiento, casos edge.
4. Identificar dependencias con `domain/`, `application/`, features previos.
5. **NO generar plan ni código todavía.**

### 3.2 Fase 2 — Sesión de Preguntas (obligatoria)

- Mínimo **5 preguntas** por feature nuevo.
- Mínimo **3 preguntas** por modificación de feature existente.
- El agente **espera respuestas**. No asume defaults silenciosamente.

```
## ❓ Preguntas antes de planear

### Comportamiento esperado
- [ ] ...

### Casos edge y errores
- [ ] ...

### Topología y dominio (Arrow, Board, Segment...)
- [ ] ...

### Datos y contratos (DTOs, ports)
- [ ] ...

### Impacto en features existentes
- [ ] ...
```

### 3.3 Fase 3 — Plan Mode

Con las respuestas, el agente genera el plan. El plan se escribe para ser ejecutado por Haiku y debe cumplir el estándar de la sección 4.

```
## 📋 PLAN — [Nombre del Feature]

### Resumen
[2-3 líneas del qué, no del cómo]

### Gherkin asociado
features/<feature-name>.feature — [escenarios cubiertos]

### Archivos a crear
- path/exacto/File.ts — [razón + firma esperada]

### Archivos a modificar
- path/exacto/Existing.ts — [qué cambia, qué NO cambia]

### Archivos que NO se tocan
- [lista explícita — Claude Code la trata como prohibición dura]

### Orden de implementación (TDD)
1. [test primero] __tests__/...spec.ts — casos: [enumerados]
2. [código mínimo para pasar] src/domain/...
3. [refactor si aplica]

### Riesgos identificados
- [riesgo]: [mitigación]

### Criterios de completitud
- [ ] Todos los escenarios Gherkin pasan en pnpm test
- [ ] [criterios adicionales verificables]
```

Aprobación explícita requerida. Palabras clave: `"aprobado"`, `"go"`, `"procede"`, `"ok plan"`.

### 3.4 Fase 4 — Handoff a Claude Code

Tras la aprobación, Antigravity entrega:

1. `features/<feature-name>.feature` — escenarios Gherkin finales.
2. `doc/<feature-name>_plan.md` — el plan aprobado completo.
3. El **prompt de arranque** para Claude Code (ver plantilla en 4.3).

Antigravity genera su entrada `.ai-usage/` y cierra sesión.

---

## 4. ESTÁNDAR DE PLANES EJECUTABLES POR HAIKU

Haiku ejecuta con precisión lo explícito y NO debe inferir lo implícito. Todo plan debe cumplir:

### 4.1 Requisitos de explicitud

- **Rutas completas y exactas** — nunca "crea el archivo de errores", siempre `src/domain/errors/TopologyErrors.ts`.
- **Firmas TypeScript completas** de toda clase/función nueva en el plan:
  ```typescript
  // El plan especifica esto, Haiku lo implementa:
  advance(steps: number): Result<AdvanceResult, ArrowError>
  ```
- **Casos de test enumerados** — cada spec lista sus `it(...)` por nombre antes de implementar.
- **Sin decisiones abiertas** — frases prohibidas en un plan: "según convenga", "si es necesario", "o similar", "el agente decide".
- **Imports indicados** cuando crucen capas o usen `import type`.

### 4.2 Validación pre-handoff

Antes de entregar, Antigravity verifica:

```
[ ] ¿Puede Haiku ejecutar cada paso sin tomar ninguna decisión de diseño?
[ ] ¿Cada paso tiene un criterio de verificación (test que pasa / comando)?
[ ] ¿El orden respeta TDD (test → código → refactor)?
[ ] ¿El orden respeta capas (errors → VOs → entities → DTOs → use case)?
[ ] ¿La lista de archivos prohibidos es explícita?
```

Si alguna casilla falla → el plan vuelve a Fase 3.
Si Haiku se bloquea 2+ veces en el mismo paso → plan deficiente, regresa a Antigravity para re-especificación. No se escala el modelo como primera medida.

### 4.3 Plantilla de prompt de arranque para Claude Code

```
Ejecuta el plan doc/<feature-name>_plan.md siguiendo CLAUDE.md.

Reglas de ejecución:
- TDD estricto: implementa primero el test del paso, verifica que falla,
  luego el código mínimo, verifica que pasa.
- Reporta "✅ Paso N completado" tras cada paso con el resultado de pnpm test.
- Si algo no está especificado en el plan: DETENTE y pregunta. No infieras.
- No toques archivos fuera del plan.
- No hagas commits. Al final sugiere mensaje(s) de commit.
- Al terminar: pnpm lint, pnpm gen-uml, y genera el reporte /ai-usage-reporter.
```

---

## 5. TDD OBLIGATORIO

- Escuela **clásica (Detroit)**: objetos reales del dominio, sin mocks en `domain/`.
- Mocks/stubs solo para ports en tests de `application/` cuando el plan lo indique.
- Ciclo por paso: **Red → Green → Refactor**. Nunca código de producción sin test rojo previo.
- Cada `features/*.feature` mapea 1:1 con un `__tests__/**/*.spec.ts`.
- Un paso del plan no se declara completado si `pnpm test` no pasa.

```
__tests__/
├── domain/          # Unit tests puros — objetos reales, cero mocks
├── application/     # Integration tests por use case
├── infrastructure/  # Tests de repositorios/adapters
└── presentation/    # Tests de lógica de UI (input, sesión)
```

---

## 6. ARQUITECTURA CLEAN + DDD

### 6.1 Estructura del proyecto

```
src/
├── domain/            # Capa 1 — Lógica pura, cero dependencias externas
│   ├── entities/      # Arrow, Head, Segment, ArrowSegment, Board, Cell, GameSession
│   ├── value-objects/ # Port, AdvanceResult, Score, ScoringConstants, ScoringTracker
│   ├── services/      # TopologyValidator, TopologyQueryService, PathChecker
│   ├── repositories/  # ILevelRepository (puerto definido en dominio)
│   └── errors/        # Errores tipados (ArrowErrors, BoardErrors, GameErrors)
├── application/       # Capa 2 — Use cases + DTOs + ports + servicios de aplicación
│   ├── use-cases/     # BuildBoardUseCase, LevelLoader, PlaceArrowUseCase, AdvanceArrowUseCase,
│   │                  # PlayMoveUseCase, SlideArrowUseCase, QueryTopologyUseCase
│   ├── dtos/
│   ├── services/      # LevelDataArrowBuilder, LevelDataBoardBuilder
│   └── ports/         # IArrowBuilder, IBoardBuilder
├── infrastructure/    # Capa 3 — Adapters, repositorios, config
│   ├── repositories/  # InMemoryLevelRepository
│   ├── shared/contracts/ # LevelDataDTOs (desviación conocida — ver CLAUDE.md)
│   └── config/
└── presentation/      # Capa 4 — UI React, controlador de juego, input, render
    ├── components/
    ├── game/
    ├── input/
    ├── rendering/
    └── preview/
```

### 6.2 Reglas de dependencia

```
domain ← application ← infrastructure ← presentation
```

- `domain` no importa nada de capas externas ni frameworks.
- `application` depende solo de `domain` y de sus propios ports.
- `infrastructure` implementa los ports de `application`.
- Las capas **no se saltan**: `infrastructure` no llama a `domain` sin pasar por `application`.

### 6.3 Naming

```typescript
class Arrow { }                                  // Entidad — PascalCase
class AdvanceArrowUseCase { }                    // Verbo + sustantivo + UseCase
interface ILevelRepository { }                   // I + sustantivo + Repository
class InMemoryLevelRepository implements ILevelRepository { }  // Impl + tecnología
// El nombre del archivo SIEMPRE coincide con la clase exportada.
```

### 6.4 Errores de dominio

```typescript
// Extender clases tipadas en domain/errors/, nunca new Error() plano
class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

type Result<T, E = DomainError> =
  | { success: true; data: T }
  | { success: false; error: E };
```

---

## 7. TOOLING

### 7.1 Package Manager — PNPM (obligatorio)

```bash
# ✅ CORRECTO                  # ❌ PROHIBIDO
pnpm install                   npm install / npm i
pnpm add <pkg>                 yarn add
pnpm add -D <pkg>              npx <tool>
pnpm dlx <tool>
```

Lock file: `pnpm-lock.yaml`. Si aparece `package-lock.json` o `yarn.lock` → reportar como issue.

### 7.2 TypeScript

- `strict: true`. **Nunca `any`** — si un tipo es difícil, se modela correctamente.
- `import type` para imports de solo tipos (`verbatimModuleSyntax`).
- Sin parameter properties en constructores (`erasableSyntaxOnly`).
- Exportaciones nombradas; default exports solo en entrypoints.

### 7.3 Modelos por herramienta

| Herramienta | Fase | Modelo |
|---|---|---|
| Antigravity | Spec / preguntas / plan | Modelo de razonamiento (tier alto) |
| Claude Code | Implementación | **Haiku** (`claude-haiku-4-5`) |
| Claude Code | Reportes ai-usage | Haiku |

---

## 8. REGISTRO DE USO DE IA (.ai-usage/)

Toda sesión de IA se documenta antes del merge — incluye planning y ejecución.

### 8.1 Protocolo

1. Crear `YYYY-MM-DD-<short-description>.md` en `.ai-usage/`.
2. Añadir entrada al índice `.ai-usage/README.md`.
3. Actualizar `.ai-usage/manifest.json` (array `entries` + `statistics`).
4. Se commitea junto al código generado (commit manual).

### 8.2 Campos por la división de roles

Cada entrada debe declarar:

```json
{
  "tool": "antigravity | claude-code",
  "phase": "planning | implementation",
  "model": "<model-id>",
  "feature": "<feature-name>",
  "linked_session": "<archivo de la sesión complementaria>"
}
```

Cada feature queda trazado con mínimo dos entradas enlazadas: planning (Antigravity) e implementación (Claude Code). Template completo en `.claude/skills/ai-usage-reporter/SKILL.md`.

### 8.3 Responsable por fase

- **Antigravity**: genera su reporte al cerrar Fase 4 (handoff).
- **Claude Code**: ejecuta `/ai-usage-reporter` como último paso del plan.

---

## 9. GIT — COMMITS MANUALES

- ❌ Ningún agente ejecuta `git commit`, `git push`, `git merge` ni modifica historia.
- ✅ Al cerrar un feature, el agente **sugiere** mensajes con conventional commits:

```
feat(domain): add CollisionSimulator with linked-segment traversal
test(application): cover AdvanceArrowUseCase edge scenarios
docs(ai-usage): register planning + implementation sessions for feature-X
```

- Sugerir commits separados cuando los cambios crucen capas o mezclen test/código/docs.

---

## 10. FAST LANE — cambios triviales

El ciclo completo aplica a features. Para cambios triviales existe vía rápida.

**Califica como trivial** (todas deben cumplirse):
- ≤ 10 líneas afectadas, 1-2 archivos.
- Cero impacto en contratos públicos, DTOs, ports o comportamiento de dominio.
- Ejemplos: typo, mensaje de error, comentario, ajuste de config.

```
⚡ FAST LANE propuesto
Cambio: [descripción]
Archivos: [lista]
¿Procedo? (sí/no)
```

Un "sí" autoriza solo ese cambio. Si crece más allá → ciclo completo. Fast lanes se agrupan en entrada semanal de `.ai-usage/`.

---

## 11. COMPORTAMIENTO DEL AGENTE

### Siempre hacer

- ✅ Preguntar antes de asumir.
- ✅ Pausar y reportar ante lo inesperado.
- ✅ Listar archivos que NO se tocan.
- ✅ Indicar efectos colaterales en otros features/capas.
- ✅ Validar el plan contra el checklist 4.2 antes del handoff.
- ✅ Mantener separación de capas de Clean Architecture.

### Nunca hacer
❌ Saltarse la fase de preguntas o el TDD.
❌ any en TypeScript.
❌ Añadir features no especificadas ("ya que estamos, agregué X").
❌ Cerrar un feature sin las entradas de .ai-usage/.

Checklist de feature completado

[ ] Spec aprobado y preguntas respondidas (Antigravity)
[ ] Gherkin en features/ y plan en doc/
[ ] TDD seguido: ningún código sin test rojo previo
[ ] Todos los escenarios Gherkin pasan: pnpm test
[ ] pnpm lint sin errores
[ ] classes.puml regenerado: pnpm gen-uml
[ ] Separación de capas respetada
[ ] Sin any, sin secrets hardcodeados
[ ] Archivos fuera del alcance intactos
[ ] Entrada .ai-usage/ planning + implementation enlazadas