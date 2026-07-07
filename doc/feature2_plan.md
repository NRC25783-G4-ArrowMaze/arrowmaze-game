# 📋 PLAN — Arrow Placement Feature

## Resumen

Implementar la entidad `Arrow` como una **lista enlazada de segmentos activos** que se coloca sobre el grafo pasivo (`Board` / `Cell`) ya existente.  
La flecha valida la topología en el momento de colocarse, calcula automáticamente sus puertos internos (`fromPort`, `toPort`) consultando las conexiones pasivas de las celdas, y notifica a cada `Cell` de su ocupación.

---

## Decisiones de Diseño (Resueltas)

| # | Decisión | Resolución |
|---|---|---|
| Q1 | Tipo del `arrowSegment` en `Cell` | `Cell` recibe solo el DTO delgado `{ isHead, cellId }`. Arrow gestiona el segmento rico internamente. Bajo acoplamiento, sin dependencia circular. |
| Q2 | Arrow como entidad vs. servicio | **Rich Domain Entity**. La lógica de ensamblaje e invariantes vive dentro de `Arrow`. Evita modelo anémico. |
| Q3 | `PlaceArrowUseCase` recibe `Board` | Sí, recibe `Board` directamente en el DTO de entrada (ya existe en memoria). Sin IO innecesario. |
| Q4 | Capa de tests | Tests unitarios puros con clases de dominio reales (Board, Cell). Sin mocks de repositorio. Escuela clásica. |
| Q5 | Validación `connections.size < 2` en `Cell` | **Se relaja.** Se elimina la restricción para body-segments. La cola de la flecha puede estar en una celda con solo 1 conexión. `Cell.ts` se modifica. |

---

## Propuesta de Cambios

### ─── CAPA: `src/domain/errors/` ──────────────────────────────

#### [NEW] [ArrowErrors.ts](file:///f:/Dev/arrowmaze-game/src/domain/errors/ArrowErrors.ts)

Errores de dominio tipados para la entidad Arrow. Extienden `Error` con código tipado.

| Error Class | Mensaje ejemplo | Cuándo se lanza |
|---|---|---|
| `ArrowPlacementError` | `"cell C5 is not physically connected to previous cell C1"` | `extend()` con celda desconectada, celda ocupada, auto-colisión, inicialización sin Head |
| `ArrowCreationError` | `"head segment requires an explicit exitPort intent"` | Constructor de Arrow sin `exitPort` |

```typescript
export class ArrowPlacementError extends Error {
  constructor(message: string) {
    super(`ArrowPlacementError: ${message}`);
    this.name = 'ArrowPlacementError';
  }
}

export class ArrowCreationError extends Error {
  constructor(message: string) {
    super(`ArrowCreationError: ${message}`);
    this.name = 'ArrowCreationError';
  }
}
```

---

### ─── CAPA: `src/domain/entities/` ────────────────────────────

#### [NEW] [ArrowSegment.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/ArrowSegment.ts)

Clase base abstracta. Nodo de la lista enlazada.

**Propiedades:**
| Propiedad | Tipo | Descripción |
|---|---|---|
| `cell` | `Cell` | Celda pasiva que ocupa |
| `fromPort` | `number \| null` | Puerto de entrada (null en Head) |
| `toPort` | `number \| null` | Puerto de salida hacia siguiente (null en cola) |
| `prev` | `ArrowSegment \| null` | Segmento anterior en la cadena |
| `next` | `ArrowSegment \| null` | Segmento siguiente en la cadena |
| `isHead` | `boolean` (abstract) | Discriminador de tipo |
| `exitPort` | `number \| null` (abstract) | Solo Head lo tiene no-null |

**Métodos:**
- `getCellId(): string` — delega a `cell.getId()`

---

#### [NEW] [Head.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/Head.ts)

Subclase concreta de `ArrowSegment`. Segmento motor.

**Invariantes forzados:**
- `isHead = true` (constante)
- `prev = null` (siempre, no configurable)
- `fromPort = null` (no tiene predecesor)
- `exitPort: number` (obligatorio, validado en rango `[0, portCount)`)

**Constructor:** `new Head(cell: Cell, exitPort: number)`

---

#### [NEW] [Segment.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/Segment.ts)

Subclase concreta de `ArrowSegment`. Segmento de cuerpo.

**Invariantes forzados:**
- `isHead = false` (constante)
- `exitPort = null` (siempre)
- `fromPort` y `toPort` son asignados por `Arrow.extend()` al enlazar

**Constructor:** `new Segment(cell: Cell)`

---

#### [NEW] [Arrow.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/Arrow.ts)

**Entidad activa. Núcleo del feature.** Lista enlazada auto-gestionada.

**Propiedades:**
- `head: Head` — acceso directo al primer nodo
- `get length: number` — recorre la cadena y cuenta

**API pública:**

| Método | Descripción |
|---|---|
| `constructor(headCell: Cell, exitPort: number)` | Crea Head, notifica `headCell.placeArrowSegment()`. Lanza `ArrowCreationError` si `exitPort` no se provee. |
| `extend(nextCell: Cell): void` | Añade `Segment` al final. Valida conectividad, ocupación, auto-colisión. Calcula `fromPort`/`toPort`. Notifica celda. |
| `destroy(): void` | Recorre la lista y llama `cell.removeArrowSegment()` en cada nodo. |

**Lógica detallada de `extend(nextCell)`:**

```
1. tail ← último segmento (recorrer desde head)
2. Verificar: nextCell es vecino físico de tail.cell
   → Si no: ArrowPlacementError("cell X is not physically connected to previous cell Y")
3. Verificar: nextCell no está ocupada
   → Si sí: ArrowPlacementError("cell X is already occupied by a different entity")
4. Verificar: nextCell no pertenece a esta misma flecha (auto-colisión)
   → Si sí: ArrowPlacementError("structural collision, cell X is occupied by self")
5. Encontrar portFromTailToNext: puerto en tail.cell que conecta a nextCell
6. Calcular fromPort del nuevo segmento: (portFromTailToNext + portCount/2) mod portCount
7. Asignar tail.toPort = portFromTailToNext
8. Crear newSegment = new Segment(nextCell)
9. Enlazar: tail.next = newSegment, newSegment.prev = tail
10. Asignar newSegment.fromPort = fromPort calculado
11. Llamar nextCell.placeArrowSegment({ isHead: false, cellId: nextCell.getId() })
```

---

#### [MODIFY] [Cell.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/Cell.ts)

**Cambio mínimo y quirúrgico.** Se elimina la restricción en `placeArrowSegment()` que impide colocar body-segments en celdas con `connections.size < 2`.

**Antes (líneas 173-178):**
```typescript
placeArrowSegment(segment: { isHead: boolean; cellId: string }): void {
    if (!segment.isHead) {
      if (this.connections.size < 2) {
        throw new Error('ArrowPlacementError: body segment requires at least two connected cells');
      }
    }
    this.arrowSegment = segment;
    this.occupied = true;
  }
```

**Después:**
```typescript
placeArrowSegment(segment: { isHead: boolean; cellId: string }): void {
    this.arrowSegment = segment;
    this.occupied = true;
  }
```

**Justificación:** La validación de conectividad es responsabilidad de la entidad `Arrow` (quien conoce la topología de su cadena), no de `Cell` (contenedor pasivo). La cola de la flecha ocupa legítimamente una celda con solo 1 conexión activa. Arrow ya valida antes de llamar a `placeArrowSegment()`.

> [!WARNING]
> Se debe verificar que los tests existentes en `board_graph.spec.ts` no dependan de esta validación. Si algún test la verifica, se eliminará ese assertion específico.

---

### ─── CAPA: `src/application/dtos/` ──────────────────────────

#### [NEW] [ArrowDTOs.ts](file:///f:/Dev/arrowmaze-game/src/application/dtos/ArrowDTOs.ts)

```typescript
interface PlaceArrowInput {
  board: Board;
  headCellId: string;
  exitPort: number;
  bodyCellIds?: string[];
}

interface ArrowSegmentDTO {
  cellId: string;
  isHead: boolean;
  fromPort: number | null;
  toPort: number | null;
  exitPort: number | null;
}

interface PlaceArrowResult {
  success: boolean;
  arrowLength: number;
  segments: ArrowSegmentDTO[];
  error?: string;
}
```

---

### ─── CAPA: `src/application/use-cases/` ─────────────────────

#### [NEW] [PlaceArrowUseCase.ts](file:///f:/Dev/arrowmaze-game/src/application/use-cases/PlaceArrowUseCase.ts)

Orquesta la colocación sin lógica de dominio propia.

**Flujo:**
1. Resolver `headCell` desde `input.board.getCell(headCellId)`.
2. `new Arrow(headCell, exitPort)` → puede lanzar `ArrowCreationError`.
3. Para cada `bodyCellId`: `arrow.extend(board.getCell(bodyCellId))`.
4. Si error → retorna `{ success: false, error }`.
5. Si éxito → proyecta la cadena a `ArrowSegmentDTO[]` y retorna `PlaceArrowResult`.

---

### ─── CAPA: `__tests__/domain/` ──────────────────────────────

#### [NEW] [arrow_placement.spec.ts](file:///f:/Dev/arrowmaze-game/__tests__/domain/arrow_placement.spec.ts)

Cubre los **17 scenarios** del feature file, agrupados por bloque:

| Bloque | # Tests | Scenarios |
|---|---|---|
| 1 — Invariantes de entidad | 6 | Creación mínima, head.prev=null, tail.next=null, enlace interno, length, exitPort→exit |
| 2 — Colocación Happy Path | 6 | Masiva, incremental, notificación celdas, puertos lineal, puertos curva, tail sin toPort |
| 3 — Restricciones | 5 | Desconectada, ocupada, auto-colisión, head obligatorio, exitPort obligatorio |
| 4 — Invariantes matemáticos | 4* | exitPort exclusivo head, aritmética modular, head.fromPort=null, destroy limpia |

*Nota: Scenarios 4 se solapan parcialmente con Bloque 1, pero se implementan como tests independientes para fidelidad al feature file.

---

## Archivos que NO se tocan

- [Board.ts](file:///f:/Dev/arrowmaze-game/src/domain/entities/Board.ts) — sin cambios
- [Port.ts](file:///f:/Dev/arrowmaze-game/src/domain/value-objects/Port.ts) — sin cambios
- [TopologyValidator.ts](file:///f:/Dev/arrowmaze-game/src/domain/services/TopologyValidator.ts) — sin cambios
- [TopologyQueryService.ts](file:///f:/Dev/arrowmaze-game/src/domain/services/TopologyQueryService.ts) — sin cambios
- [PathChecker.ts](file:///f:/Dev/arrowmaze-game/src/domain/services/PathChecker.ts) — sin cambios
- [BuildBoardUseCase.ts](file:///f:/Dev/arrowmaze-game/src/application/use-cases/BuildBoardUseCase.ts) — sin cambios
- [LoadLevelUseCase.ts](file:///f:/Dev/arrowmaze-game/src/application/use-cases/LoadLevelUseCase.ts) — sin cambios
- [QueryTopologyUseCase.ts](file:///f:/Dev/arrowmaze-game/src/application/use-cases/QueryTopologyUseCase.ts) — sin cambios
- `src/infrastructure/**` — sin cambios

---

## Orden de Implementación

| Paso | Archivo | Justificación |
|---|---|---|
| 1 | `src/domain/errors/ArrowErrors.ts` | Dependencia de todo lo demás |
| 2 | `src/domain/entities/ArrowSegment.ts` | Clase base para Head y Segment |
| 3 | `src/domain/entities/Head.ts` | Depende de ArrowSegment |
| 4 | `src/domain/entities/Segment.ts` | Depende de ArrowSegment |
| 5 | `src/domain/entities/Cell.ts` **(MODIFY)** | Relajar validación de body-segment — prerrequisito para que Arrow.extend() funcione |
| 6 | `src/domain/entities/Arrow.ts` | Depende de Head, Segment, ArrowErrors, Cell relajado |
| 7 | `src/application/dtos/ArrowDTOs.ts` | DTOs para el use case |
| 8 | `src/application/use-cases/PlaceArrowUseCase.ts` | Depende de Arrow + DTOs |
| 9 | `__tests__/domain/arrow_placement.spec.ts` | Verifica todo |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|---|---|
| Tests existentes en `board_graph.spec.ts` podrían depender de la validación `connections.size < 2` que se elimina | Revisar tests existentes antes del paso 5. Si hay assertions dependientes, se eliminan o adaptan |
| Auto-colisión necesita recorrer toda la cadena → O(n) | Aceptable para el tamaño de flechas del juego (máx ~20 segmentos) |
| `Cell.placeArrowSegment` podría ser llamado directamente sin pasar por `Arrow` (bypass) | Documentar en JSDoc que la validación de colocación está en `Arrow`, no en `Cell` |

---

## Criterios de Completitud

- [ ] Todos los 17 scenarios del feature file pasan como tests de Jest
- [ ] Separación de capas: `Arrow`, `Head`, `Segment`, `ArrowSegment` en `domain/entities`; errores en `domain/errors`; DTOs y UseCase en `application`
- [ ] `Cell.ts` modificado solo en el punto aprobado (eliminar validación body-segment)
- [ ] `Board.ts` y demás archivos no tocados
- [ ] Sin `any` explícito en TypeScript
- [ ] `pnpm test` pasa sin errores (incluye tests existentes + nuevos)

---

## Verificación

### Automated Tests
```bash
# Tests nuevos del feature
pnpm test -- --testPathPattern="arrow_placement"

# Tests existentes para verificar no-regresión
pnpm test -- --testPathPattern="board_graph"

# Suite completa
pnpm test
```

### Manual Verification
- Revisar output de tests en consola
- Verificar que los 17 scenarios están cubiertos 1:1
