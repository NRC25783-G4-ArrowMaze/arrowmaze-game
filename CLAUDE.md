# Arrow Maze — Claude Code Guide

## Project Overview

Arrow Maze is a browser + mobile puzzle game (React + TypeScript + Vite + Capacitor).
The codebase follows **Clean Architecture** and **DDD (Domain-Driven Design)** strictly across all layers.

Package manager: **pnpm**

---

## Architecture

```
src/
├── domain/            # Layer 1 — Pure business logic, zero external dependencies
│   ├── entities/      # Arrow, Head, Segment, ArrowSegment, Board, Cell, GameSession
│   ├── value-objects/ # Port, AdvanceResult, Score, ScoringConstants, ScoringTracker
│   ├── services/      # TopologyValidator, TopologyQueryService, PathChecker
│   ├── repositories/  # ILevelRepository (port defined in domain)
│   └── errors/        # Typed domain errors (ArrowErrors, BoardErrors, GameErrors)
├── application/       # Layer 2 — Use cases + DTOs + ports + app services
│   ├── use-cases/     # BuildBoardUseCase, LevelLoader, PlaceArrowUseCase, AdvanceArrowUseCase,
│   │                  # PlayMoveUseCase, SlideArrowUseCase, QueryTopologyUseCase
│   ├── dtos/          # ArrowDTOs, MovementDTOs, GameDTOs, SessionDTOs, SlideDTOs, LevelData
│   ├── services/      # LevelDataArrowBuilder, LevelDataBoardBuilder
│   └── ports/         # IArrowBuilder, IBoardBuilder
├── infrastructure/    # Layer 3 — Frameworks, adapters
│   ├── repositories/  # InMemoryLevelRepository
│   ├── shared/
│   │   └── contracts/ # LevelDataDTOs (see Known deviations below)
│   └── config/        # api-config
└── presentation/      # Layer 4 — React UI, game controller, input, rendering
    ├── components/    # BoardComponent, ArrowComponent, CellComponent, GameOverlay, ...
    ├── game/          # GameController, useGameController, scene, sampleLevel, sampleLevel2
    ├── input/         # useBoardInput, tapResolver, PlayMoveCommand
    ├── rendering/     # boardLayout
    └── preview/       # mockScene, heartScene, NeonInteractiveBoard
```

### Layer Dependency Rules

```
domain ← application ← infrastructure ← presentation
```

- **Domain** never imports from application, infrastructure, or any framework.
- **Application** never imports from infrastructure — depends on port interfaces only.
- **Infrastructure** implements ports defined in application (or in domain, e.g. `ILevelRepository`).
- **Presentation** may import from application and domain, never the other way around.

Layer boundaries are enforced by ESLint (`no-restricted-imports` blocks in `eslint.config.js`) — `pnpm lint` fails on cross-layer imports.

**Known deviation (pending refactor — do not extend it):**
- `src/application/**` imports `LevelDataDTO` from `src/infrastructure/shared/contracts/LevelDataDTOs.ts` (6 files, type-only). The contract should live in application; `src/application/dtos/LevelData.ts` is the orphaned original (currently unused). The ESLint boundary rule carves out this path until the contract is moved.

---

## Tests

```
__tests__/
├── domain/          # Pure unit tests — real domain objects, no mocks
├── application/     # Integration tests per use case
├── infrastructure/  # Repository/adapter tests
└── presentation/    # UI logic tests (input routing, game session)
```

BDD acceptance criteria live in `features/*.feature` (Gherkin). Each feature file corresponds to one `__tests__/**/*.spec.ts`.

Feature plans and technical specs are documented in `doc/` before implementation.

---

## Commands

| Command | Description |
|---|---|
| `pnpm test` | Run the full Jest suite |
| `pnpm test -- --testPathPatterns="<name>"` | Run a specific spec file (Jest 30: the flag is plural; `--testPathPattern` fails) |
| `pnpm build` | TypeScript compile + Vite production build |
| `pnpm lint` | Run ESLint |
| `pnpm gen-uml` | Regenerate `classes.puml` from TypeScript sources |

---

## Coding Conventions

- **TypeScript**: `strict: true`. No `any` — ever.
- **Imports**: Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- **No parameter properties** in constructors (`erasableSyntaxOnly` constraint from `tsconfig.app.json`).
- **Domain errors**: Extend typed error classes in `src/domain/errors/`, never throw plain `new Error()` from domain code.
- **Tests**: Classical TDD school — test domain logic with real objects, not mocks.
- **Comments**: Only when the WHY is non-obvious. No docblocks for self-documenting code.
- **No `any` workarounds**: If a type is hard, model it correctly.

---

## AI Usage Documentation

Every AI-assisted session **must** be documented before merging.

**Protocol:**
1. Create `YYYY-MM-DD-short-description.md` in `.ai-usage/`
2. Add an entry to `.ai-usage/README.md` (index table)
3. Update `.ai-usage/manifest.json` (entries array + statistics)
4. Commit alongside the generated code in the same PR

Use the `/ai-usage-reporter` command to generate the report automatically from the conversation.

The format template is defined in `.claude/skills/ai-usage-reporter/SKILL.md`.

---

## Adding a New Feature

1. Write the Gherkin acceptance criteria in `features/<feature-name>.feature`
2. Create the plan document in `doc/<feature-name>_plan.md` (see `doc/feature2_plan.md` for format)
3. Implement following the layer order: errors → value objects → domain entities → application DTOs → use case → tests
4. Verify all scenarios pass: `pnpm test`
5. Update `classes.puml`: `pnpm gen-uml`
6. Document AI usage in `.ai-usage/`
7. If the `src/` structure changed (new folders, ports, or use cases), update the Architecture tree in this file — and keep `README.md` and `.agents/rules/arrow-game.md` consistent (they duplicate it and drift)

## Execution Contract (Antigravity → Claude Code)

- This repo uses spec-driven development. Plans arrive pre-approved in `doc/<feature>_plan.md`.
- Execute plans literally. If a step is ambiguous or unspecified: STOP and ask. Never infer design decisions.
- Default model for implementation: Haiku. If blocked twice on the same step, report back — the plan returns to Antigravity for re-specification.
- Never run `git commit` / `git push`. Suggest conventional commit messages at the end.
- AI usage entries must include: `tool`, `phase`, `model`, `feature`, `linked_session`.