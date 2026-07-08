# FIX-2 — Detección de colisión en la cola (capa de Dominio)

Feature: **`Arrow.advance()` debe bloquearse también cuando el FRENTE (cola) de una flecha multi-celda toparía con una entidad ajena, no solo cuando lo hace la cabeza.**

> ⚠️ **Fix delicado: toca dominio (`Arrow.advance`).** Es el corazón cinemático del juego. El cambio es quirúrgico (una validación adicional en la fase 3), pero exige verificación de regresión completa.

## Resumen

`advance()` valida **solo** el destino de la **cabeza** (fase 3, [Arrow.ts:196-210](../src/domain/entities/Arrow.ts)). En una flecha multi-celda el destino de la cabeza es su propio cuerpo (`self`, que se libera) → nunca bloquea. La única celda que entra a **territorio nuevo** es la **cola** (el frente del avance), y su destino **no se valida** → `Cell.placeArrowSegment` lo sobre-escribe en silencio. Por eso una serpiente atraviesa otra flecha.

**Fix:** en la fase 3, además de la cabeza, validar el destino de la **cola** contra ocupación ajena → `blocked` (rollback, sin mutar nada).

---

## User Review Required

> [!IMPORTANT]
> **Alcance del chequeo: solo la COLA (recomendado).** Justificación: en el modelo head-push, cada segmento excepto la cola se mueve a una celda que su propio cuerpo libera (self). **Solo la cola entra a una celda nueva** → es el único segmento que puede chocar con algo ajeno. Por eso basta validar la cola (la cabeza ya se valida para el caso 1-celda). Alternativa: validar *todos* los destinos — innecesario y más costoso. Confirma cola-only.

> [!IMPORTANT]
> **Sumidero ≠ colisión.** Si el destino de la cola es un `exit` (null), NO se bloquea: la cola fluye al sumidero y se purga (comportamiento actual del commit). El nuevo chequeo solo dispara `blocked` ante celda **ocupada por entidad ajena** (no null, no self).

> [!NOTE]
> **`Cell.placeArrowSegment` NO se toca.** Una guarda defensiva (lanzar si ocupado) es tentadora pero arriesgada: `_commitAdvance` libera y re-ocupa celdas en cierto orden, y una guarda podría romper reconstrucciones válidas (curvas, self). El fix se concentra en la fase 3 (pre-commit), que es el punto correcto y atómico.

---

## Gherkin asociado

`features/tail-collision-detection.feature`:

| Bloque | Escenarios |
|:---|:---|
| 1 — Colisión en la cola (el fix) | cola topa flecha ajena → `blocked` + rollback; bloquea aun si la cabeza era válida |
| 2 — No falsos positivos (regresión) | cola a celda libre → `advanced`; cola a sumidero → `advanced` (purga); lazy-check de celda fuera de ruta intacto |
| 3 — Compatibilidad | colisión de cabeza/1-celda idéntica; auto-colisión (self) nunca bloquea |

---

## Proposed Changes

### Capa de Dominio — Entidad Arrow (ÚNICO cambio de producción)

#### [MODIFY] `src/domain/entities/Arrow.ts` — `advance()`, fase 3

Insertar, **después** del chequeo de cabeza (línea 210) y **antes** de `_commitAdvance` (línea 212):

```typescript
      // ── Phase 3.5: Validate tail's (leading edge) target ──
      // En head-push, la COLA es el único segmento que entra a una celda nueva.
      // Si ese destino está ocupado por una entidad ajena → blocked (rollback).
      // Sumidero (null) no bloquea: la cola se purga en el commit.
      const tailTarget = targets[targets.length - 1];
      const tailTargetCell = tailTarget.targetCell;
      if (
        tailTargetCell !== null &&
        tailTargetCell.isOccupied() &&
        !this._cellBelongsToSelf(tailTargetCell)
      ) {
        return { outcome: 'blocked', freedCellIds: [], occupiedCellIds: [] };
      }
```

**Notas de corrección:**
- Para una flecha de **1 celda**, `targets[0] === targets[último]`: el chequeo de cabeza ya retornó (`destroyed`/`blocked`) antes de llegar aquí → sin doble evaluación.
- `_cellBelongsToSelf` garantiza que una celda **self** (liberada por el arrastre) NO bloquee.
- El rollback es "no hacer nada": como aún no se llamó `_commitAdvance`, ningún contenedor fue mutado (respeta el invariante de inmutabilidad in-flight del spec).

> No se modifica `_calculateTargets`, `_commitAdvance`, `Cell`, ni ningún otro archivo de producción.

### Tests

#### [NEW] `__tests__/domain/arrow_tail_collision.spec.ts`

Unitarios puros (objetos reales del dominio, sin mocks). Cubre los 3 bloques:

```
describe('Arrow.advance — colisión en la cola')
  it('bloquea cuando la cola avanza a celda ocupada por flecha ajena')
  it('rollback: cadena, longitud y contenedores intactos tras blocked')
  it('bloquea aun si la cabeza avanzaría a self (cabeza válida, cola ajena)')

describe('Arrow.advance — sin falsos positivos')
  it('avanza (advanced) cuando el destino de la cola está libre')
  it('cola hacia sumidero se purga (advanced), no bloquea')
  it('ignora celda ajena fuera de la ruta (lazy checking intacto)')

describe('Arrow.advance — compatibilidad')
  it('colisión de cabeza / 1-celda sigue dando blocked')
  it('cola hacia celda self nunca bloquea (avanza normal)')
```

---

## Riesgos (alto, por ser dominio)

| Riesgo | Mitigación |
|:---|:---|
| **Romper el escenario "Lazy checking" existente** (`arrow_movement.feature`) | Ese escenario tiene la celda ajena (C2b) **fuera** de la ruta; la cola apunta al sumidero. El nuevo chequeo solo mira el destino de la cola (no null, ocupado, ajeno) → **no dispara** ahí. Verificar que `arrow_movement.spec` sigue verde. |
| Falso bloqueo por tratar self como ajeno | `_cellBelongsToSelf` ya distingue self; se reutiliza tal cual. |
| Cambiar el conteo/score de partidas existentes | `advance()` solo añade un caso `blocked` nuevo (antes era overwrite silencioso). Revisar specs de `GameSession`/scoring por si algún test dependía del comportamiento erróneo. |
| Regresión amplia en cinemática | **Correr `pnpm test` completo** y exigir 216 + nuevos en verde antes de cerrar. Si algún test previo cambia de verde a rojo, STOP y reportar (no ajustar el test a ciegas). |

---

## Orden de Implementación (TDD estricto)

| Paso | Acción | Verificación |
|:---|:---|:---|
| 1 | `__tests__/domain/arrow_tail_collision.spec.ts` (Red) | falla en los casos de cola |
| 2 | Insertar fase 3.5 en `Arrow.advance()` (Green) | los nuevos pasan |
| 3 | `pnpm test` **completo** | 216 previos + nuevos en verde, **sin regresión** |
| 4 | `pnpm lint` | sin errores |
| 5 | `pnpm gen-uml` | `classes.puml` actualizado |
| 6 | `.ai-usage/` | entrada planning + implementation |

> Si en el paso 3 algún test previo se rompe: **detenerse y reportar** (el plan vuelve a revisión). No reescribir tests de dominio existentes para "pasar".

---

## Observación adicional (no bloqueante)

El invariante del spec `arrow_movement.feature` dice *"1 nodo reclamado por la **cabeza**"*, pero mecánicamente **lo reclama la cola** (es la que entra a la celda nueva). Vale la pena, en un PR aparte de documentación, afinar esa redacción para que el spec describa el modelo real. No forma parte de este fix de código.

---

## Relación con FIX-1

Con FIX-2 en su lugar, el Bloque 2 del Gherkin de **FIX-1** (`slide-arrow-movement`) cubrirá también **serpientes**: el slide se detendrá en el `blocked` de la cola sin cambiar `SlideArrowUseCase`.
