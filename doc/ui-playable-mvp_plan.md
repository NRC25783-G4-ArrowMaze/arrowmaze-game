# UI — MVP Jugable (solo Infraestructura + Presentación)

Feature: **Construir la capa de presentación que conecta el motor de juego existente con una UI jugable mínima, sin tocar Dominio ni Aplicación.**

## Resumen

Hoy la UI es el scaffold de Vite: [App.tsx](../src/App.tsx) muestra una pantalla estática con un botón "Start Game" sin handler, y [App.css](../src/App.css) contiene CSS muerto de la plantilla (`.hero`, `.counter`, `#next-steps`…). Existe una capa de Dominio + Aplicación completa y testeada (`Board`, `Arrow`, `GameSession`, `PlayMoveUseCase`, `LevelLoader`, `InMemoryLevelRepository`) **totalmente desconectada de React**.

Este plan construye un **MVP jugable de un nivel**: cargar un nivel (mock simulando backend), renderizar tablero + flechas, ejecutar movimientos vía `PlayMoveUseCase`, y mostrar un HUD con movimientos restantes / score / veredicto.

**Restricción dura del alcance:** se modifican únicamente las capas **Infraestructura** (`src/infrastructure/`) y **Presentación** (`src/presentation/`, `App.tsx`, `main.tsx`, CSS, `index.html`). **Cero cambios** a `src/domain/**` y `src/application/**`. La Regla de Dependencia (`presentation → infrastructure → application → domain`) lo permite: presentación e infraestructura pueden consumir lo de adentro sin que lo de adentro cambie.

---

## User Review Required

> [!IMPORTANT]
> **Coordenadas de tablero = mock temporal "del backend".** El `LevelDataDTO` actual ([LevelDataDTOs.ts](../src/infrastructure/shared/contracts/LevelDataDTOs.ts)) describe un **grafo de puertos sin coordenadas `x/y`**. Decisión tomada: se añaden `x/y` **opcionales** a `LevelCellDTO` (un campo de contrato de infraestructura) y se rellenan en fixtures mock que simulan la respuesta del backend. Al ser opcionales, `LevelDataBoardBuilder` (aplicación) no se ve afectado: solo valida `portCount`. Cuando exista el backend real, las coords vendrán en el payload y los fixtures mock se eliminan.

> [!WARNING]
> **No hay mecánica de "rotar flechas" en el dominio.** `Arrow` solo expone `advance()` (un tick en dirección de su `exitPort`). El MVP entrega la interacción que el dominio **sí** soporta: clic en una flecha → `PlayMoveUseCase` avanza esa flecha un tick. La rotación (sugerida por el tagline actual) requiere trabajo de Dominio + Aplicación y queda **fuera de alcance** (feature separado).

> [!NOTE]
> **Composition root vive en Infraestructura.** El cableado de repositorio + builders + use cases se hace en una factory de infraestructura (`src/infrastructure/factories/`). La presentación consume esa factory; no instancia use cases por su cuenta para mantener el grafo de dependencias en un solo lugar.

---

## Diagnóstico de la UI actual (revisión)

| Archivo | Hallazgo | Acción |
|:---|:---|:---|
| [App.tsx](../src/App.tsx) | Pantalla estática, botón sin handler, no renderiza juego | Reescribir → monta `GameScreen` |
| [App.css](../src/App.css) | CSS muerto del scaffold Vite (`.hero`, `.counter`, `#next-steps`, `#docs`, `.vite`…) | Reemplazar por estilos del juego |
| [index.css](../src/index.css) | `#root` fijado a `1126px` con bordes laterales (layout de landing). Variables de tema reutilizables (`--accent`, dark mode) | Conservar tema; ajustar layout `#root` a juego |
| [index.html](../index.html) | `<title>arrow-maze-client</title>` genérico; sin meta PWA/Capacitor | Title + `theme-color` + `viewport-fit=cover` |
| [api-config.ts](../src/infrastructure/config/api-config.ts) | Apunta a `localhost:3000/api` (backend inexistente) | Sin tocar; el mock simula su respuesta |

---

## Proposed Changes

### Capa de Infraestructura

#### [MODIFY] `src/infrastructure/shared/contracts/LevelDataDTOs.ts`

Añadir coordenadas **opcionales** a `LevelCellDTO` (campo de presentación que en el futuro proveerá el backend):

```typescript
export interface LevelCellDTO {
  id: string;
  portCount: number;
  x?: number;   // ← NUEVO (opcional) — posición de render; mock hasta tener backend
  y?: number;   // ← NUEVO (opcional)
}
```

> Opcional ⇒ `LevelDataBoardBuilder.validateCellData()` (aplicación) sigue pasando sin cambios. No se toca aplicación.

#### [NEW] `src/infrastructure/fixtures/mockLevels.ts`

Uno o más `LevelDataDTO` jugables y **ganables**, con coords `x/y` por celda. Diseño del nivel semilla:

- Cadena de celdas de 4 puertos conectadas en línea/curva, con al menos un **puerto de salida abierto** al final (un puerto sin vecino → `targetCell === null` → la flecha sale → `destroyed`).
- Una flecha cuya cabeza apunta hacia esa cadena, de modo que `advance()` repetido la lleve a la salida y vacíe el tablero (→ `WON`).
- `allowedMoves` holgado para completarlo (p. ej. longitud de la ruta + margen).

```typescript
import type { LevelDataDTO } from '../shared/contracts/LevelDataDTOs';

export const MOCK_LEVELS: LevelDataDTO[] = [
  {
    id: 'level-1',
    name: 'First Steps',
    difficulty: 'easy',
    allowedMoves: 8,
    cells: [
      { id: 'c0', portCount: 4, x: 0, y: 0 },
      { id: 'c1', portCount: 4, x: 1, y: 0 },
      { id: 'c2', portCount: 4, x: 2, y: 0 },
      // ...
    ],
    connections: [
      { fromCell: 'c0', fromPort: 1, toCell: 'c1', toPort: 3 },
      { fromCell: 'c1', fromPort: 1, toCell: 'c2', toPort: 3 },
      // c2.port1 queda libre → salida
    ],
    arrows: [
      { id: 'a0', head: { cellId: 'c0', exitPort: 1 }, body: [] },
    ],
  },
];
```

> El nivel exacto se ajusta durante implementación verificando con un test de humo que `LevelDataBoardBuilder` + `LevelDataArrowBuilder` lo construyen sin lanzar, y que es ganable avanzando la flecha.

#### [NEW] `src/infrastructure/services/MockLevelService.ts`

Adaptador que **simula la respuesta async del backend** (resuelve un `LevelDataDTO` desde `MOCK_LEVELS`, opcionalmente con un pequeño `setTimeout` para imitar latencia). Implementa el mismo contrato que usará el cliente HTTP real más adelante.

```typescript
import type { LevelDataDTO } from '../shared/contracts/LevelDataDTOs';
import { MOCK_LEVELS } from '../fixtures/mockLevels';

export class MockLevelService {
  async fetchLevel(levelId: string): Promise<LevelDataDTO> {
    const level = MOCK_LEVELS.find(l => l.id === levelId);
    if (!level) throw new Error(`MockLevelService: level '${levelId}' not found`);
    return level;
  }
}
```

#### [NEW] `src/infrastructure/factories/GameCompositionRoot.ts`

Composition root: ensambla builders + `LevelLoader` + `InMemoryLevelRepository` + `AdvanceArrowUseCase` + `PlayMoveUseCase`, y expone una **fachada delgada** para la presentación. Sin lógica de negocio nueva — solo cableado y delegación.

```typescript
import { LevelDataBoardBuilder } from '../../application/services/LevelDataBoardBuilder';
import { LevelDataArrowBuilder } from '../../application/services/LevelDataArrowBuilder';
import { LevelLoader } from '../../application/use-cases/LevelLoader';
import { AdvanceArrowUseCase } from '../../application/use-cases/AdvanceArrowUseCase';
import { PlayMoveUseCase } from '../../application/use-cases/PlayMoveUseCase';
import { GameSession } from '../../domain/entities/GameSession';
import { MockLevelService } from '../services/MockLevelService';
import type { LoadedLevel } from '../../domain/repositories/ILevelRepository';
import type { PlayMoveInput, PlayMoveResult } from '../../application/dtos/SessionDTOs';

export interface NewGame {
  board: LoadedLevel['board'];
  arrows: LoadedLevel['arrows'];
  session: GameSession;
}

export class GameCompositionRoot {
  private readonly levelService = new MockLevelService();
  private readonly levelLoader = new LevelLoader(
    new LevelDataBoardBuilder(),
    new LevelDataArrowBuilder(),
  );
  private readonly playMove = new PlayMoveUseCase(new AdvanceArrowUseCase());

  async startLevel(levelId: string): Promise<NewGame> {
    const data = await this.levelService.fetchLevel(levelId);
    const { board, arrows } = this.levelLoader.load(data);
    return { board, arrows, session: new GameSession(data.allowedMoves) };
  }

  play(input: PlayMoveInput): PlayMoveResult {
    return this.playMove.execute(input);
  }
}
```

> `GameCompositionRoot` solo instancia y delega a clases existentes de aplicación/dominio. No define reglas. Esto mantiene la presentación libre de cableado y respeta "no tocar aplicación/dominio".

---

### Capa de Presentación — `src/presentation/`

#### [NEW] `src/presentation/state/arrowProjection.ts`

Helper puro que **proyecta** la cadena de una `Arrow` (dominio) a un view-model para render, recorriendo `head → next`. Espeja la proyección que ya hace `AdvanceArrowUseCase._projectChain` pero del lado de presentación (lectura, sin mutación). Necesario porque `PlayMoveResult` no devuelve los segmentos y no podemos modificar el use case.

```typescript
import type { Arrow } from '../../domain/entities/Arrow';

export interface ArrowSegmentView {
  cellId: string;
  isHead: boolean;
  exitPort: number | null;   // dirección de la cabeza (para dibujar la punta)
  entryPort: number | null;
}

export function projectArrow(arrow: Arrow): ArrowSegmentView[] { /* traverse head.next */ }
```

#### [NEW] `src/presentation/state/useGame.ts`

Hook React que mantiene el estado vivo de la partida y expone acciones. Es el único punto que llama a `GameCompositionRoot`.

Estado: `{ status: 'idle'|'loading'|'playing'|'won'|'lost'|'error', board, arrows, movesRemaining, score, lastError }`.

Acciones:
- `start(levelId)` → `compositionRoot.startLevel(...)`, setea board/arrows/session.
- `advanceArrow(arrowId)` → llama `compositionRoot.play({ session, board, arrow })`, refresca `movesRemaining` / `gameStatus` / `score` desde el `PlayMoveResult`, fuerza re-render (las entidades mutan en sitio; usar un contador `version` para invalidar memos).
- `reset()` → vuelve a `idle`.

> El hook guarda las instancias `board/arrows/session` en `useRef` (mutan en sitio) y un `version` en `useState` para disparar re-render tras cada movimiento.

#### [NEW] `src/presentation/components/BoardView.tsx`

Render SVG del tablero a partir de `board.getAllCells()` y las coords mock (`x/y`):
- Cada celda como nodo (círculo/cuadro) posicionado por `x/y` escalado.
- Conexiones como líneas entre celdas vecinas (recorriendo puertos vía `cell.getNeighborAtPort`).
- Puertos libres (sin vecino) marcados como "salidas".

#### [NEW] `src/presentation/components/ArrowOverlay.tsx`

Dibuja cada flecha sobre el tablero usando `projectArrow(arrow)`: resalta las celdas ocupadas (cabeza + cuerpo) y orienta la punta según `exitPort` de la cabeza. Cada flecha es **clicable** → `advanceArrow(arrow.id)`.

> Para mapear `arrow.id` a la instancia, `useGame` mantiene `arrows: Arrow[]` y un índice por id (los DTO traen `id`, pero `Arrow` no lo expone — el hook conserva el pareo `id ↔ Arrow` del orden de `LevelLoader`, que respeta el orden de `data.arrows`).

#### [NEW] `src/presentation/components/Hud.tsx`

Cabecera de juego: movimientos restantes, score (cuando `WON`), banner de estado (`IN_PROGRESS`/`WON`/`LOST`), botón "Reiniciar". Mensaje de error de movimiento (`PlayMoveResult.error`) como toast/línea.

#### [NEW] `src/presentation/components/GameScreen.tsx`

Compone `Hud` + `BoardView` + `ArrowOverlay` + pantalla de inicio (botón "Start Game" → `start('level-1')`) y de fin (won/lost → "Reiniciar"). Consume `useGame`.

#### [NEW] `src/presentation/styles/game.css`

Estilos del juego (reutiliza variables de tema de [index.css](../src/index.css): `--accent`, `--bg`, dark mode). Layout responsivo para móvil (Capacitor).

---

### Capa de Presentación — archivos raíz

#### [MODIFY] `src/App.tsx`

Reemplazar el contenido estático por el montaje de `GameScreen`.

```tsx
import GameScreen from './presentation/components/GameScreen'
import './presentation/styles/game.css'

const App: React.FC = () => <GameScreen />
export default App
```

#### [REPLACE] `src/App.css`

Eliminar todo el CSS muerto del scaffold Vite. Si queda vacío, borrar el archivo y quitar su import.

#### [MODIFY] `src/index.css`

Conservar variables de tema y reset. Ajustar `#root`: quitar el ancho fijo `1126px` y los `border-inline` de landing; usar layout flexible centrado apto para juego/móvil.

#### [MODIFY] `index.html`

`<title>Arrow Maze</title>`, `<meta name="theme-color">`, `viewport-fit=cover` para Capacitor.

---

### Archivos que NO se tocan (frontera dura)

- **Todo `src/domain/**`** (entidades, value-objects, services, errors, repositories).
- **Todo `src/application/**`** (use-cases, dtos, ports, services).
- `src/infrastructure/config/api-config.ts`
- `src/infrastructure/repositories/InMemoryBoardRepository.ts`
- Todos los `__tests__/**` existentes y `features/**`.

> Único archivo de infraestructura que se **modifica** es `shared/contracts/LevelDataDTOs.ts` (añadir `x?/y?` opcionales). El resto de infraestructura tocada son archivos **nuevos**.

---

## Orden de Implementación

| Paso | Archivo | Justificación | Verificación |
|:---|:---|:---|:---|
| **1** | `LevelDataDTOs.ts` (+`x?/y?`) | Contrato de coords mock | `pnpm build` compila; tests existentes verdes |
| **2** | `fixtures/mockLevels.ts` | Datos del nivel jugable | Test de humo: builders construyen sin lanzar |
| **3** | `services/MockLevelService.ts` | Adaptador async tipo backend | Compila |
| **4** | `factories/GameCompositionRoot.ts` | Composition root / fachada | Compila; `startLevel('level-1')` devuelve board/arrows/session |
| **5** | `presentation/state/arrowProjection.ts` | Proyección de cadena para render | Función pura compila |
| **6** | `presentation/state/useGame.ts` | Estado + acciones | Compila |
| **7** | `BoardView.tsx` + `game.css` | Render del tablero | Render visual del nivel |
| **8** | `ArrowOverlay.tsx` | Render + click de flechas | Click avanza la flecha |
| **9** | `Hud.tsx` | Movimientos / score / estado | HUD actualiza tras cada move |
| **10** | `GameScreen.tsx` | Composición + inicio/fin | Flujo completo idle→playing→won |
| **11** | `App.tsx` / `App.css` / `index.css` / `index.html` | Montaje y limpieza scaffold | Sin CSS muerto |
| **12** | `pnpm build` + `pnpm lint` | Regresión + estilo | Sin errores |
| **13** | `pnpm test` | Dominio/aplicación intactos | Suite verde sin cambios |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| Añadir `x?/y?` rompe tests de `LevelDataBoardBuilder` | Son **opcionales**; `validateCellData` solo chequea `portCount`. Verificar suite tras paso 1. |
| `Arrow` no expone `id` para mapear clicks | El hook conserva el pareo `id ↔ Arrow` desde el orden de `data.arrows` (preservado por `LevelLoader`). |
| Entidades mutan en sitio → React no re-renderiza | `useRef` para entidades + `version` en `useState` que se incrementa tras cada move. |
| Nivel mock no ganable (flecha nunca sale) | Test de humo que avanza la flecha hasta `destroyed` y verifica `board` vacío → `WON`. |
| Tentación de "arreglar" lógica en presentación | Frontera dura: cualquier regla nueva va a futuro feature de Aplicación, no aquí. |
| Tagline "rotating arrows" sin soporte de dominio | Ajustar copy del HUD a la mecánica real (avanzar), o marcar rotación como "próximamente". |

---

## Criterios de Completitud

```
[ ] Un nivel se carga (mock async) y se renderiza: tablero + flecha
[ ] Clic en flecha la avanza un tick vía PlayMoveUseCase
[ ] HUD muestra movimientos restantes, estado y score al ganar
[ ] Estados idle / loading / playing / won / lost / error cubiertos en la UI
[ ] CSS muerto del scaffold Vite eliminado; index.html con title/meta de juego
[ ] pnpm build sin errores; pnpm lint sin errores
[ ] pnpm test: suite existente verde, SIN modificar dominio/aplicación ni sus tests
[ ] src/domain/** y src/application/** sin cambios (git diff vacío en esas rutas)
[ ] Sin any; strict mode respetado; import type donde aplique
[ ] Entrada .ai-usage/ generada (planning + implementation)
```

---

## Verificación Plan (checklist pre-handoff)

```
[x] ¿Respeta "solo infraestructura + presentación, sin tocar dominio/aplicación"?
    → Sí. Único MODIFY en aplicación = NINGUNO. Único MODIFY infra = DTO con campos opcionales.
[x] ¿Cada paso tiene criterio de verificación?
    → Sí, columna "Verificación" por paso + criterios de completitud.
[x] ¿La frontera dura de archivos está explícita?
    → Sí, sección "Archivos que NO se tocan".
[x] ¿Se respeta la Regla de Dependencia?
    → Sí. presentation → infrastructure → application → domain (solo lectura/instanciación).
[x] ¿Honestidad sobre la mecánica disponible (advance vs rotate)?
    → Sí, documentado en User Review Required.
```
