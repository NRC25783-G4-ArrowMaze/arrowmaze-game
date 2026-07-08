# Implementación del Motor de Movimiento de Flechas

Feature: **Resolución y desplazamiento topológico de entidades direccionales (Flechas)**

## Resumen

Implementar la lógica de avance (`advance`) en la entidad `Arrow`, permitiéndole resolver su cinemática (calcular trayectoria), simular colisiones, ejecutar rollback atómico, y autodestruirse al alcanzar sumideros (`exit`). El `AdvanceArrowUseCase` orquestará el tick desde la capa de aplicación.

---

## Análisis Algorítmico del Motor Cinemático

### Modelo de Movimiento: Shift-Forward Simultáneo

Cada tick, **todos los segmentos avanzan una posición hacia adelante** (en la dirección de viaje de la flecha). La cabeza calcula la nueva celda; el resto se desplaza en cascada.

```
Antes:  [C1(head), C2(body), C3(tail)]
                ↓ shift-forward
Después: [C2(head), C3(body)]  // tail salió a exit, C1 liberada
```

### Cálculo de Dirección de Salida por Segmento

| Tipo de segmento | Fórmula de `exitDir` | Justificación |
|:---|:---|:---|
| **Head** | `head.exitPort` (almacenado) | El motor direccional de la flecha |
| **Body** (tiene `next`) | `findConnectingPort(cell, next.cell)` | Sale hacia donde está el siguiente segmento |
| **Tail** (sin `next`) | `(entryPort + P/2) % P` | Fórmula de puerto opuesto |

> [!IMPORTANT]
> Para curvas dinámicas, el body **NO** usa la fórmula opuesta (`(entryPort + P/2) % P`). Usa el puerto que conecta con el siguiente segmento. Esto se verifica en el Scenario 9 del spec donde C1b(body, entryPort:3) sale por port 2, no por port 1.

### Recálculo del `exitPort` de la Nueva Cabeza

Cuando la cabeza se mueve a una nueva celda, su `exitPort` se determina así:

| Caso | Fórmula |
|:---|:---|
| Tiene body tras ella | `findConnectingPort(newHeadCell, nextSegment.newCell)` |
| Está sola (single-head) | `(entryPortInNewCell + P/2) % P` |

Donde `entryPortInNewCell` = el puerto vecino por el que entra (derivado de la conexión).

### Invariante de Movimiento

> En cada tick: exactamente **1 nodo nuevo** es reclamado (por la cabeza) y **1 nodo es liberado** (por la cola).
> Excepción: si la cola fluye al sumidero, la flecha se **acorta en 1** segmento (0 nodos reclamados, 2 liberados).

### Collision Check — Evaluación Perezosa (Lazy)

Solo se verifica la celda destino de la **cabeza**. Las celdas destino de body/tail son **siempre** celdas que ya pertenecen a la propia cadena (que se vacían simultáneamente), por lo que no requieren verificación.

```
F1: [C1(head), C2(body), C3(tail)]
     ↓ head apunta a C2
     C2 está ocupada por el propio body → se autoevacúa → NO es colisión
     C2b (adyacente) tiene otra entidad → IGNORADA (fuera de predicción cinemática)
```

---

## User Review Required

> [!IMPORTANT]
> **Inmutabilidad de segmentos via reconstrucción:** Siguiendo tu directriz, cada tick reconstruye objetos `Head` / `Segment` nuevos en las celdas destino, en vez de mutar `readonly cell` o `readonly exitPort`. Esto requiere cambiar `Arrow.head` de `readonly` a un backing field privado `_head` con getter público.

> [!WARNING]
> **`Arrow.head` deja de ser `readonly`:** El campo `Arrow.head` actualmente es `readonly head: Head`. Propongo cambiar a `private _head: Head` con un getter `get head(): Head`. Esto es necesario para que `advance()` pueda reconstruir la cadena. El getter mantiene la interfaz pública intacta, pero código que haga `arrow.head = ...` directamente dejará de compilar (lo cual es deseable).

---

## Open Questions

> [!IMPORTANT]
> **¿Debe `AdvanceArrowUseCase` gestionar múltiples flechas por tick?** El spec muestra escenarios donde F2 se evacúa primero y luego F1 avanza. El use case actual propuesto maneja **una sola flecha por invocación**. La orquestación de múltiples flechas (orden de prioridad, cola de activación) quedaría como un feature separado. ¿Confirmas que el alcance es una flecha por invocación?

> [!NOTE]
> **Evento de dominio `ArrowBlocked`:** Por ahora se implementa como parte del `AdvanceResult` retornado por `arrow.advance()` (`outcome: 'blocked'`). No se introduce infraestructura de domain events (pub/sub). Si en el futuro se necesita un bus de eventos, la migración sería agregar emisión del evento ADEMÁS del return.

---

## Proposed Changes

### Capa de Dominio — Errores

#### [MODIFY] [ArrowErrors.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/errors/ArrowErrors.ts)

Agregar `ArrowCinematicError`:

```typescript
/**
 * ArrowCinematicError — thrown when external code attempts to mutate
 * the arrow's segment chain during an in-flight transaction.
 */
export class ArrowCinematicError extends Error {
  constructor(message: string) {
    super(`ArrowCinematicError: ${message}`);
    this.name = 'ArrowCinematicError';
  }
}
```

Usado cuando `extend()` o destrucción parcial se intentan durante `inFlight === true`.

---

### Capa de Dominio — Value Objects

#### [NEW] [AdvanceResult.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/value-objects/AdvanceResult.ts)

Resultado del avance a nivel de dominio. No es un DTO — es un value object que la entidad Arrow retorna.

```typescript
type AdvanceOutcome = 'advanced' | 'blocked' | 'destroyed';

interface AdvanceResult {
  outcome: AdvanceOutcome;
  freedCells: string[];     // IDs de celdas liberadas
  occupiedCells: string[];  // IDs de celdas recién ocupadas
}
```

---

### Capa de Dominio — Entidades

#### [MODIFY] [Arrow.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/entities/Arrow.ts)

Cambios principales:

1. **`readonly head` → `private _head` con getter**:
   ```diff
   -  readonly head: Head;
   +  private _head: Head;
   +  get head(): Head { return this._head; }
   ```

2. **Nuevo estado `_inFlight: boolean`**:
   - Se activa al inicio de `advance()`, se desactiva al finalizar.
   - `extend()` y cualquier mutación externa lanzan `ArrowCinematicError` si `_inFlight === true`.

3. **Nuevo método `advance(): AdvanceResult`** — Algoritmo en 4 fases:

   ```
   Phase 1: _collectChain()
     → Array ordenado de segmentos [head, body..., tail]

   Phase 2: _calculateTargets(chain)
     → Para cada segmento, calcula exitDir y targetCell
     → Retorna array de { segment, exitDir, targetCell: Cell | null }

   Phase 3: _validateAdvance(targets)
     → Solo verifica head target (lazy check)
     → Si head target es exit → retorna 'exit'
     → Si head target ocupada por externo → retorna 'blocked'
     → Si libre o propia → retorna 'clear'

   Phase 4: _commitAdvance(chain, targets)
     → Libera todas las celdas antiguas
     → Construye nuevos Head/Segment en las celdas destino
     → Purga segmentos cuyo target es null (exit)
     → Recalcula exitPort de nueva cabeza
     → Registra occupación en celdas nuevas
     → Actualiza _head
   ```

4. **Guards de `inFlight` en `extend()` y destructores externos**.

5. **Nuevos helpers privados**:
   - `_collectChain(): ArrowSegment[]` — Lineariza la linked list
   - `_calculateExitDir(segment): number` — Calcula dirección de salida
   - `_getEntryPortInCell(fromCell, toCell): number` — Puerto de entrada en la celda destino

#### [MODIFY] [Head.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/entities/Head.ts)

Sin cambios. Los objetos `Head` se reconstruyen durante `advance()` — la inmutabilidad de `readonly exitPort` se preserva.

#### [MODIFY] [ArrowSegment.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/entities/ArrowSegment.ts)

Sin cambios funcionales. Los segmentos se reconstruyen como nuevos objetos durante `advance()`.

#### [MODIFY] [Segment.ts](file:///home/jr_g/Develop/arrowmaze-game/src/domain/entities/Segment.ts)

Sin cambios. Los objetos `Segment` se reconstruyen durante `advance()`.

---

### Capa de Aplicación — DTOs

#### [NEW] [MovementDTOs.ts](file:///home/jr_g/Develop/arrowmaze-game/src/application/dtos/MovementDTOs.ts)

```typescript
interface AdvanceArrowInput {
  board: Board;
  arrow: Arrow;
}

interface AdvanceResultDTO {
  success: boolean;
  outcome: 'advanced' | 'blocked' | 'destroyed';
  segments: ArrowSegmentDTO[];  // Reutiliza ArrowSegmentDTO existente
  freedCellIds: string[];
  occupiedCellIds: string[];
  arrowLength: number;
  error?: string;
}
```

---

### Capa de Aplicación — Use Cases

#### [NEW] [AdvanceArrowUseCase.ts](file:///home/jr_g/Develop/arrowmaze-game/src/application/use-cases/AdvanceArrowUseCase.ts)

```typescript
class AdvanceArrowUseCase {
  execute(input: AdvanceArrowInput): AdvanceResultDTO
}
```

Responsabilidades:
1. Recibir `Arrow` + `Board` (ya en memoria)
2. Invocar `arrow.advance()`
3. Mapear `AdvanceResult` (dominio) a `AdvanceResultDTO` (aplicación)
4. Proyectar la cadena resultante a `ArrowSegmentDTO[]`
5. Manejar errores y retornar resultado seguro

---

### Tests

#### [NEW] [arrow_movement.spec.ts](file:///home/jr_g/Develop/arrowmaze-game/__tests__/domain/arrow_movement.spec.ts)

Suite cubriendo los **9 escenarios** del feature spec, organizados en 3 bloques:

**Bloque 1 — Movimiento exitoso y destrucción perezosa (3 escenarios):**
1. Destrucción inmediata de cabeza-única apuntando a exit
2. Avance de cabeza-única propagándose hasta el límite del grafo
3. Avance simultáneo de cuerpo completo (Head-push cinemático, 3 ticks)

**Bloque 2 — Resolución de colisiones y rollback atómico (3 escenarios):**
4. Detección de colisión estructural → `ArrowBlocked`
5. Liberación asíncrona de ruta compartida (prioridad de evacuación)
6. Rollback atómico preserva linked-list de 5 segmentos

**Bloque 3 — Cálculo cinemático durante el vuelo (3 escenarios):**
7. Evaluación de colisión estrictamente perezosa (lazy checking)
8. Bloqueo de mutación topológica por transacción in-flight → `ArrowCinematicError`
9. Resolución matemática y propagación de puertos en curvas dinámicas

Helper compartido: `buildMovementBoard()` construye la topología del Background del feature spec (C1, C1b, C2, C2b, C3, C3b con P=4 puertos y las conexiones especificadas).

#### [NEW] [AdvanceArrowUseCase.spec.ts](file:///home/jr_g/Develop/arrowmaze-game/__tests__/application/AdvanceArrowUseCase.spec.ts)

Tests de integración del use case:
1. Advance exitoso retorna DTO con `success: true`, segmentos actualizados
2. Arrow bloqueada retorna DTO con `outcome: 'blocked'`
3. Arrow destruida retorna DTO con `outcome: 'destroyed'`, `segments: []`

---

### Diagrama de Clases

#### [MODIFY] [classes.puml](file:///home/jr_g/Develop/arrowmaze-game/classes.puml)

Agregar:
- `ArrowCinematicError extends Error`
- `AdvanceOutcome` type
- `AdvanceResult` value object
- `AdvanceArrowInput` interface
- `AdvanceResultDTO` interface
- `AdvanceArrowUseCase` class
- Nuevos métodos en `Arrow`: `advance()`, `_collectChain()`, `_calculateExitDir()`, `_getEntryPortInCell()`, campo `_inFlight`

---

## Archivos que NO se tocan

- `Cell.ts` — contenedor pasivo, sin cambios
- `Board.ts` — sin cambios
- `Port.ts` — sin cambios
- `TopologyValidator.ts` — sin cambios
- `TopologyQueryService.ts` — sin cambios
- `PathChecker.ts` — sin cambios
- `BoardFactory.ts` — sin cambios
- `InMemoryBoardRepository.ts` — sin cambios
- `PlaceArrowUseCase.ts` — sin cambios
- `ArrowDTOs.ts` — sin cambios (reutilizamos `ArrowSegmentDTO`)
- `GameDTOs.ts` — sin cambios
- `LevelData.ts` — sin cambios
- Todos los tests existentes — sin cambios

---

## Orden de Implementación

| Paso | Archivo | Justificación |
|:---|:---|:---|
| **1** | `ArrowErrors.ts` | Dependencia base: `ArrowCinematicError` es usado por Arrow |
| **2** | `AdvanceResult.ts` | Value object de retorno, necesario para tipado de Arrow |
| **3** | `Arrow.ts` | Core: `_head` refactor + `_inFlight` + `advance()` |
| **4** | `arrow_movement.spec.ts` | Tests de dominio: validan los 9 escenarios |
| **5** | `MovementDTOs.ts` | DTOs de entrada/salida del use case |
| **6** | `AdvanceArrowUseCase.ts` | Orquestación a nivel de aplicación |
| **7** | `AdvanceArrowUseCase.spec.ts` | Tests del use case |
| **8** | `classes.puml` | Actualización del diagrama |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| Reconstrucción de segmentos pierde referencias externas | Los tests validan que las celdas nuevas están correctamente ocupadas y las antiguas liberadas |
| `_findConnectingPort` retorna `null` en body con topología rota | Guard con `ArrowCinematicError`: "corrupted segment chain — body segment has no path to next" |
| Cambio de `readonly head` rompe código existente | El getter `get head()` mantiene la misma interfaz pública. Tests existentes siguen funcionando |
| Lazy collision check ignora bloqueo en celdas intermedias | Es comportamiento intencionado del spec: celdas intermedias siempre son propias y se autoevacúan |

---

## Criterios de Completitud

- [ ] Los 9 escenarios del feature spec pasan como tests unitarios
- [ ] Tests del `AdvanceArrowUseCase` pasan
- [ ] Tests existentes (`arrow_placement.spec.ts`, `board_graph.spec.ts`) siguen pasando sin modificación
- [ ] `ArrowCinematicError` lanzado correctamente durante `inFlight`
- [ ] Separación de capas respetada (Clean Architecture)
- [ ] No hay `any` injustificado
- [ ] No se modificaron archivos fuera del alcance del plan
- [ ] `classes.puml` actualizado con las nuevas clases y métodos
