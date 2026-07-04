# Arrow Maze — Client

> Motor de juego de laberinto de flechas sobre grafo de nodos. Implementado con Clean Architecture y Domain-Driven Design en TypeScript + React + Vite.

---

## Descripción

**Arrow Maze** es un juego de puzzle donde el jugador coloca y dirige flechas sobre un tablero representado como un grafo pasivo de nodos conectados por puertos. Las flechas son entidades activas (listas enlazadas) que se desplazan autónomamente por el grafo siguiendo la topología de conexiones.

El cliente está construido como una aplicación web con soporte móvil nativo vía **Capacitor**.

---

## Stack tecnológico

| Herramienta | Rol |
|---|---|
| **Vite + React** | Framework de presentación y bundler |
| **TypeScript** (`strict: true`) | Lenguaje base — sin `any` |
| **Capacitor** | Wrapper nativo para iOS / Android |
| **Jest** | Tests unitarios y de integración |
| **pnpm** | Gestor de paquetes (obligatorio) |
| **PlantUML** (`tplant`) | Generación de diagramas de clase desde código |

---

## Arquitectura

El proyecto sigue **Clean Architecture** en 4 capas. La dependencia fluye de afuera hacia adentro:

```
presentation ──► infrastructure ──► application ──► domain
```

```
src/
├── domain/               # Lógica pura. Sin dependencias externas.
│   ├── entities/         # Arrow, Head, Segment, ArrowSegment, Board, Cell, GameSession
│   ├── value-objects/    # Port, AdvanceResult, Score, ScoringConstants, ScoringTracker
│   ├── services/         # TopologyValidator, TopologyQueryService, PathChecker
│   ├── repositories/     # ILevelRepository (puerto definido en dominio)
│   └── errors/           # ArrowErrors, BoardErrors, GameErrors
├── application/          # Casos de uso + DTOs + puertos + servicios de aplicación
│   ├── use-cases/        # BuildBoardUseCase, LevelLoader, PlaceArrowUseCase, AdvanceArrowUseCase,
│   │                     # PlayMoveUseCase, SlideArrowUseCase, QueryTopologyUseCase
│   ├── dtos/             # ArrowDTOs, MovementDTOs, GameDTOs, SessionDTOs, SlideDTOs, LevelDataDTOs
│   ├── services/         # LevelDataArrowBuilder, LevelDataBoardBuilder
│   └── ports/            # IArrowBuilder, IBoardBuilder
├── infrastructure/       # Adaptadores y repositorios
│   ├── repositories/     # InMemoryLevelRepository
│   └── config/
└── presentation/         # UI React, controlador de juego, input y render
    ├── components/       # BoardComponent, ArrowComponent, CellComponent, GameOverlay, ...
    ├── game/             # GameController, useGameController, scene, sampleLevel(2)
    ├── input/            # useBoardInput, tapResolver, PlayMoveCommand
    ├── rendering/        # boardLayout
    └── preview/          # mockScene, heartScene, NeonInteractiveBoard
```

---

## Features implementadas

### Grupo A — Motor de juego

| # | Feature | Estado |
|---|---|---|
| **A1** | Tablero como grafo de nodos en memoria — `Board` / `Cell` con topología port-based | ✅ Completo |
| **A2** | Flechas como listas enlazadas — `Arrow → Head → Segment` sobre el grafo | ✅ Completo |
| **A3** | Resolución y desplazamiento — motor cinemático Head-push con rollback atómico | ✅ Completo |
| **A4** | Detección de victoria y derrota por vaciado del tablero / agotamiento de movimientos | ✅ Completo |
| **A5** | Cálculo y composición de la puntuación por sesión de juego | ✅ Completo |

### Grupo B — Renderizado y presentación

| # | Feature | Estado |
|---|---|---|
| **B1** | Renderizado visual del tablero sobre el grafo de nodos | ✅ Completo |
| **B2** | Animaciones y retroalimentación visual de acciones del motor | ⚠️ En progreso (`feature/animaciones`) |
| **B3** | Captura y enrutamiento de entrada del jugador hacia el motor | ✅ Completo |

### Grupo C — Flujo y estados

| # | Feature | Estado |
|---|---|---|
| **C1** | Máquina de estados del ciclo de vida de una partida (`GameSession`) | ✅ Completo |
| **C2** | Carga y deserialización de niveles — `LevelLoader` + `InMemoryLevelRepository` listos; falta repositorio JSON/remoto | ⚠️ Parcial |
| **C3** | Pantalla de selección de niveles con indicador de progreso y control de desbloqueo | ❌ Pendiente |
| **C4** | Pantallas de soporte: inicio, victoria, derrota, pausa, ajustes | ❌ Pendiente |

### Grupo D — Persistencia

| # | Feature | Estado |
|---|---|---|
| **D1** | Persistencia local del progreso y puntuaciones en SQLite | ❌ Pendiente |
| **D2** | Sincronización del progreso local con servidor remoto | ❌ Pendiente |

---

## Conceptos clave del dominio

### Tablero (A1)

El tablero es un **grafo pasivo** de celdas conectadas por puertos indexados. No usa coordenadas cartesianas: dos celdas son vecinas si y solo si comparten una conexión port-to-port.

- `Cell` — contenedor pasivo con $P$ puertos (par obligatorio). Sin reglas de movimiento.
- `Port` — punto de conexión estático, indexado de $0$ a $P-1$.
- `Board` — grafo que gestiona conexiones bidireccionales y el ciclo de vida de las celdas.
- **Exit (salida):** puerto de una celda sin vecino conectado.

### Flechas (A2)

Una flecha es una **lista doblemente enlazada** de `ArrowSegment`:

```
Head → Segment → Segment → ... → Segment(tail)
```

- `Head` — motor direccional. Tiene `exitPort` (dirección de viaje). `prev = null` siempre.
- `Segment` — nodo de cuerpo. Tiene `entryPort` (puerto de entrada), calculado al enlazarse.
- `Arrow` — entidad activa. Única con derecho a llamar `Cell.placeArrowSegment()` y `Cell.removeArrowSegment()`.

### Motor de movimiento (A3)

Algoritmo **Head-push** en 4 fases por tick:

| Fase | Qué hace |
|---|---|
| **Collect** | Lineariza la lista enlazada en un array ordenado |
| **Project** | Calcula `exitDir` y `targetCell` para cada segmento |
| **Validate** | Revisión perezosa (lazy): solo verifica el target de la **cabeza** |
| **Commit** | Libera celdas antiguas, reconstruye la cadena en las celdas destino |

Dirección de salida por tipo de segmento:

| Segmento | Fórmula de `exitDir` |
|---|---|
| Head | `head.exitPort` (almacenado) |
| Body (tiene `next`) | `findConnectingPort(cell, next.cell)` |
| Tail (sin `next`) | `(entryPort + P/2) % P` |

Resultados posibles (`AdvanceOutcome`): `'advanced'` · `'blocked'` · `'destroyed'`

---

## Tests

```
__tests__/
├── domain/          # Unit tests puros — grafo, movimiento, colisiones, sesión, scoring
├── application/     # Integration tests por use case (place, advance, play, slide, load)
├── infrastructure/  # Repositorios (InMemoryLevelRepository)
└── presentation/    # Enrutamiento de input y sesión de juego
```

**228 tests pasando · 20 suites · 0 fallos**

```bash
pnpm test                                 # Suite completa
pnpm test -- --watch                      # Modo watch
pnpm test -- --testPathPatterns="<name>"  # Un spec concreto (Jest 30: flag en plural)
```

---

## Comandos de desarrollo

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Ejecutar tests
pnpm test

# Lint
pnpm lint

# Generar diagrama de clases UML
pnpm gen-uml

# Build de producción
pnpm build
```

---

## Documentación técnica

| Documento | Descripción |
|---|---|
| [`doc/feature1.md`](./doc/feature1.md) | Spec de A1 — Grafo de nodos (Board + Cell) |
| [`doc/feature2_plan.md`](./doc/feature2_plan.md) | Plan de A2 — Arrow Placement |
| [`doc/feature3_plan.md`](./doc/feature3_plan.md) | Plan de A3 — Motor de movimiento |
| [`doc/readme_plan.md`](./doc/readme_plan.md) | Roadmap maestro de los 13 features |
| [`doc/plantuml-generation.md`](./doc/plantuml-generation.md) | Guía de generación de diagramas UML |
| [`classes.puml`](./classes.puml) | Diagrama de clases PlantUML actualizado |
| [`.ai-usage/README.md`](./.ai-usage/README.md) | Registro de uso de IA en el proyecto |
| [`CLAUDE.md`](./CLAUDE.md) | Reglas y convenciones para Claude Code |

---

## Convenciones del proyecto

- **Package manager:** `pnpm` exclusivamente — `npm` y `yarn` están prohibidos.
- **TypeScript:** `strict: true`, sin `any`, `import type` para tipos.
- **Arquitectura:** las capas no se saltan — `infrastructure` nunca llama directamente a `domain`.
- **Errores de dominio:** clases tipadas en `domain/errors/`, nunca `new Error()` plano.
- **TDD:** ciclo Red → Green → Refactor. Ningún código de producción sin test rojo previo.
- **Commits:** convencional commits sugeridos por el agente, ejecutados manualmente.
- **IA:** toda sesión de IA se documenta en `.ai-usage/` antes del merge.

---

## Licencia

Proyecto privado. Todos los derechos reservados.
