# H2 — Mapas 3D: Plan de implementación

## Resumen

Los niveles actuales existen en un plano XY (col, row). Este feature agrega un tercer eje Z
(`layer`): un nivel 3D es un conjunto de capas XY, donde las flechas pueden atravesar de una
capa a otra a través de los puertos 4 (forward/Z+) y 5 (back/Z-). El dominio y la aplicación
no cambian; todo el trabajo ocurre en el contrato de datos (DTOs/Scene) y en la capa de
presentación (Forge + juego).

**Gherkin asociado:** `features/H2-mapas-3d.feature` — 21 escenarios en 7 bloques.

---

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Representación del eje Z | Campo `layer?: number` en `LevelCellDTO` / `SceneCell`. El ID sigue siendo `"col,row"`. |
| Declaración explícita de modo | `mapMode?: '2d' \| '3d'` en `LevelDataDTO` / `Scene` |
| portCount por celda o por modo | Por celda (`portCount: 6` para celdas 3D) |
| Rotación de cabeza en celdas 3D | Cicla por todos los puertos: `(exitPort + 1) % portCount` |
| Visualización inter-capa en Forge | Línea punteada + badge ▲/▼ en las esquinas del tile |
| Vista en juego | Una capa activa a la vez; botones ◀/▶; flechas visibles solo en la capa de su cabeza |
| Animación de transición de capa | **Fuera de scope (iteración 2)** |

---

## Convención de puertos (extendida)

```
Port 0 = N   (dCol:  0, dRow: -1)
Port 1 = E   (dCol:  1, dRow:  0)
Port 2 = S   (dCol:  0, dRow:  1)
Port 3 = O   (dCol: -1, dRow:  0)
Port 4 = Z+  (forward / arriba en Z)  — esquina sup-izq del tile en Forge
Port 5 = Z-  (back    / abajo en Z)   — esquina inf-der del tile en Forge
```

---

## Archivos a crear

### [NEW] `src/presentation/game/levels/levelMapa3dSample.ts`

Nivel de ejemplo 3D con 3 capas (basado en el JSON del spec). Propósito: validar el pipeline
end-to-end sin necesidad de publicar un nivel en producción.

Estructura: 3 grupos de 9 celdas (layers 0, 1, 2), cada celda con `portCount: 6`.
Las celdas de borde de cada capa tienen conexiones inter-capa (port 4 → port 5) hacia la
siguiente capa.

```typescript
// Firma esperada:
export const LEVEL_3D_SAMPLE: Scene  // mapMode: '3d', 3 layers
```

---

## Archivos a modificar

### Paso 1 — `src/presentation/game/scene.ts`

**Cambios en interfaces:**

```typescript
// ANTES:
export interface LevelCellDTO {
  id: string
  portCount: number
}

// DESPUÉS:
export interface LevelCellDTO {
  id: string
  portCount: number
  layer?: number           // ← NUEVO: índice Z (0-based). Ausente = 0 (retrocompat).
}

// ANTES:
export interface LevelDataDTO {
  id: string
  // ...
}

// DESPUÉS:
export interface LevelDataDTO {
  id: string
  mapMode?: '2d' | '3d'   // ← NUEVO: modo de nivel. Ausente = '2d'.
  // ... resto sin cambios
}
```

**Cambios en `sceneFromLevelData`:**

```typescript
// Antes:
return { id: c.id, col, row, portCount: c.portCount }

// Después:
return { id: c.id, col, row, portCount: c.portCount, layer: c.layer ?? 0 }
```

Y propagar `mapMode`:
```typescript
// Añadir al objeto Scene resultante:
...(dto.mapMode !== undefined ? { mapMode: dto.mapMode } : {}),
```

**Cambios en `toLevelDataDTO`:**

```typescript
// Añadir al objeto DTO resultante:
...(scene.mapMode !== undefined ? { mapMode: scene.mapMode } : {}),

// En el map de cells: incluir layer solo si es > 0 (retrocompat):
cells: scene.cells.map((c) => ({
  id: c.id,
  portCount: c.portCount,
  ...(c.layer !== undefined && c.layer > 0 ? { layer: c.layer } : {}),
})),
```

**Añadir `mapMode` a la interfaz `Scene`:**

```typescript
export interface Scene {
  id: string
  mapMode?: '2d' | '3d'   // ← NUEVO
  // ... resto sin cambios
}
```

---

### Paso 2 — `src/presentation/rendering/boardLayout.ts`

**Extender `portDelta`:**

```typescript
export function portDelta(port: number): GridDelta {
  switch (port) {
    case 0: return { dCol:  0,    dRow: -1   }  // N
    case 1: return { dCol:  1,    dRow:  0   }  // E
    case 2: return { dCol:  0,    dRow:  1   }  // S
    case 3: return { dCol: -1,    dRow:  0   }  // O
    case 4: return { dCol: -0.5,  dRow: -0.5 }  // Z+ (esquina sup-izq)  ← NUEVO
    case 5: return { dCol:  0.5,  dRow:  0.5 }  // Z- (esquina inf-der)  ← NUEVO
    default:
      throw new RangeError(
        `portDelta: índice de puerto ${port} fuera de rango [0, 5]`,
      )
  }
}
```

**Nueva exportación:**

```typescript
/**
 * Retorna true si el puerto conecta a una capa Z distinta (port 4 = Z+, port 5 = Z-).
 */
export function isInterLayerPort(port: number): boolean {
  return port === 4 || port === 5
}
```

---

### Paso 3 — `src/presentation/forge/state/sceneOps.ts`

**`addCell` con nuevos parámetros opcionales:**

```typescript
// ANTES:
export function addCell(scene: Scene, col: number, row: number): Scene {
  const id = cellIdAt(col, row)
  if (scene.cells.some((c) => c.id === id)) return scene
  const newCell: SceneCell = { id, col, row, portCount: 4 }
  return { ...scene, cells: [...scene.cells, newCell] }
}

// DESPUÉS:
export function addCell(
  scene: Scene,
  col: number,
  row: number,
  layer: number = 0,
  portCount: number = 4,
): Scene {
  const id = cellIdAt(col, row)
  // En niveles 3D, el mismo "col,row" puede existir en diferentes layers —
  // pero el ID sigue siendo "col,row", así que verificamos también el layer.
  if (scene.cells.some((c) => c.id === id && (c.layer ?? 0) === layer)) {
    return scene
  }
  const newCell: SceneCell = { id, col, row, portCount, layer }
  return { ...scene, cells: [...scene.cells, newCell] }
}
```

> [!IMPORTANT]
> En niveles 3D la misma coordenada `"col,row"` puede existir en layers distintos,
> por lo que la comprobación de duplicado debe incluir el layer.

**`rotateHead` dinámico:**

```typescript
// ANTES:
const newExitPort = (arrow.head.exitPort + 1) % 4

// DESPUÉS:
const headCell = scene.cells.find((c) => c.id === arrow.head.cellId)
if (!headCell) return scene
const portCount = headCell.portCount
const newExitPort = (arrow.head.exitPort + 1) % portCount
```

---

### Paso 4 — `src/presentation/forge/state/forgeStore.ts`

**Nuevos campos en `ForgeState`:**

```typescript
export interface ForgeState {
  // ... existente ...
  activeLayer: number          // ← NUEVO
  maxLayer: number             // ← NUEVO (computed: max layer de las celdas)
  setActiveLayer: (layer: number) => void  // ← NUEVO
  // addCell actualiza firma:
  addCell: (col: number, row: number, layer?: number, portCount?: number) => void
}
```

**Valores iniciales:**

```typescript
activeLayer: 0,
maxLayer: 0,
```

**Nueva acción `setActiveLayer`:**

```typescript
setActiveLayer: (layer) => set({ activeLayer: layer }),
```

**Actualizar `addCell`:**

```typescript
addCell: (col, row, layer = 0, portCount = 4) => {
  commit((scene) => {
    const next = sceneOps.addCell(scene, col, row, layer, portCount)
    return next
  })
  // Recalcular maxLayer tras commit
  set((s) => ({
    maxLayer: Math.max(0, ...s.scene.cells.map((c) => c.layer ?? 0)),
  }))
},
```

**Actualizar `loadScene`:**

```typescript
loadScene: (newScene) => {
  const maxCol = newScene.cells.reduce((m, c) => Math.max(m, c.col), 0)
  const maxRow = newScene.cells.reduce((m, c) => Math.max(m, c.row), 0)
  const maxLayer = newScene.cells.reduce((m, c) => Math.max(m, c.layer ?? 0), 0)  // ← NUEVO
  set({
    scene: newScene,
    gridCols: Math.max(8, maxCol + 1),
    gridRows: Math.max(8, maxRow + 1),
    maxLayer,                              // ← NUEVO
    activeLayer: 0,                        // ← NUEVO: reset al cargar
    history: { past: [], future: [] },
  })
},
```

---

### Paso 5 — `src/presentation/forge/components/ForgeCanvas.tsx`

**Nuevas props:**

```typescript
interface ForgeCanvasProps {
  scene: Scene
  gridCols: number
  gridRows: number
  selectedArrowId?: string | null
  activeLayer: number          // ← NUEVA
  portCountForNew?: number     // ← NUEVA (default 4; 6 en modo 3D)
}
```

**Filtrado de celdas por capa:**

```typescript
// ANTES: const ghostPositions: Point[] = []
// DESPUÉS: solo celdas de la capa activa
const visibleCells = scene.cells.filter((c) => (c.layer ?? 0) === activeLayer)
const occupiedCells = new Set(visibleCells.map((c) => c.id))
```

**Conexiones inter-capa (línea punteada):**

```typescript
// En la capa de conexiones:
{scene.connections.map((conn, idx) => {
  const fromCell = visibleCells.find((c) => c.id === conn.fromCell)
  const toCell = visibleCells.find((c) => c.id === conn.toCell)

  const fromIsInterLayer = isInterLayerPort(conn.fromPort)
  const toIsInterLayer = isInterLayerPort(conn.toPort)

  // Conexión normal (ambas celdas en la capa activa, ports planar)
  if (fromCell && toCell && !fromIsInterLayer && !toIsInterLayer) {
    // render normal (sin cambios)
  }

  // Conexión inter-capa: solo se muestra si la celda origen está en la capa activa
  if (fromCell && fromIsInterLayer) {
    // render: línea punteada desde el port hasta el borde del tile + badge ▲
  }
  if (toCell && toIsInterLayer) {
    // render: línea punteada + badge ▼
  }
})}
```

**Ports clicables (modo connect) — 4 o 6 handles:**

```typescript
// ANTES: [0, 1, 2, 3].map((port) => ...)
// DESPUÉS:
const portIndices = Array.from({ length: cell.portCount }, (_, i) => i)
portIndices.map((port) => {
  const pt = portPoint(center, port)
  const isInterLayer = isInterLayerPort(port)
  // Renders normal para 0-3; badge ▲/▼ para 4/5
})
```

**Flechas filtradas por capa:**

```typescript
// Solo mostrar flechas cuya celda cabeza esté en la capa activa
const visibleArrows = scene.arrows.filter((a) => {
  const headCell = visibleCells.find((c) => c.id === a.head.cellId)
  return headCell !== undefined
})
```

**`handleCellClick` en modo 3D:**

```typescript
addCell(col, row, activeLayer, portCountForNew ?? 4)
```

---

### Paso 6 — `src/presentation/forge/components/LevelPropertiesPanel.tsx`

**Nuevas props:**

```typescript
interface LevelPropertiesPanelProps {
  // ... existente ...
  maxLayer: number  // ← NUEVA (readonly, para mostrar capas)
}
```

**Nuevo campo `mapMode` en el render:**

```tsx
{/* Modo del nivel */}
<div style={{ marginBottom: '10px' }}>
  <label ...>Modo de nivel</label>
  <select
    value={scene.mapMode ?? '2d'}
    onChange={(e) => onSceneUpdate({ mapMode: e.target.value as '2d' | '3d' })}
  >
    <option value="2d">2D (plano)</option>
    <option value="3d">3D (capas Z)</option>
  </select>
</div>

{/* Info de capas (solo en modo 3D, readonly) */}
{scene.mapMode === '3d' && (
  <div style={{ marginBottom: '10px' }}>
    <label ...>Capas Z</label>
    <p style={{ fontSize: '12px', color: '#666' }}>
      {maxLayer + 1} capa(s) definidas (0 … {maxLayer})
    </p>
  </div>
)}
```

---

### Paso 7 — `src/presentation/forge/ForgeApp.tsx`

**Leer nuevos campos del store:**

```typescript
const activeLayer = useForgeStore((s) => s.activeLayer)
const maxLayer = useForgeStore((s) => s.maxLayer)
const setActiveLayer = useForgeStore((s) => s.setActiveLayer)
```

**Barra de capas Z (solo si `scene.mapMode === '3d'`):**

```tsx
{scene.mapMode === '3d' && (
  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 8px', background: '#e0e7ff', borderRadius: '4px' }}>
    <button
      onClick={() => setActiveLayer(activeLayer - 1)}
      disabled={activeLayer === 0}
    >◀</button>
    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
      Capa Z: {activeLayer} / {maxLayer}
    </span>
    <button
      onClick={() => setActiveLayer(activeLayer + 1)}
      disabled={activeLayer === maxLayer}
    >▶</button>
    <button
      onClick={() => {
        setActiveLayer(maxLayer + 1)
        // maxLayer se actualiza cuando se agregue la primera celda en la nueva capa
      }}
      style={{ marginLeft: '8px' }}
    >+ Nueva capa</button>
  </div>
)}
```

**Pasar `activeLayer` y `portCountForNew` a `ForgeCanvas`:**

```tsx
<ForgeCanvas
  scene={scene}
  gridCols={gridCols}
  gridRows={gridRows}
  selectedArrowId={selectedArrowId}
  activeLayer={activeLayer}
  portCountForNew={scene.mapMode === '3d' ? 6 : 4}
/>
```

**Pasar `maxLayer` a `LevelPropertiesPanel`:**

```tsx
<LevelPropertiesPanel
  scene={scene}
  gridCols={gridCols}
  gridRows={gridRows}
  maxLayer={maxLayer}
  onSceneUpdate={setLevelProps}
  onGridUpdate={(cols, rows) => { setGridCols(cols); setGridRows(rows) }}
/>
```

---

### Paso 8 — `GameView` (vista del juego)

> Verificar ruta exacta antes de implementar: `App.tsx` importa de
> `'./presentation/components/GameView'`.

**Estado local de capa activa:**

```typescript
const [activeLayer, setActiveLayer] = useState(0)
const maxLayer = useMemo(
  () => scene.cells.reduce((m, c) => Math.max(m, c.layer ?? 0), 0),
  [scene]
)
const is3D = scene.mapMode === '3d'
```

**Barra de capas Z (solo en 3D):**

```tsx
{is3D && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f1f5f9' }}>
    <button onClick={() => setActiveLayer((l) => l - 1)} disabled={activeLayer === 0}>◀</button>
    <span>Capa {activeLayer + 1} / {maxLayer + 1}</span>
    <button onClick={() => setActiveLayer((l) => l + 1)} disabled={activeLayer === maxLayer}>▶</button>
  </div>
)}
```

**Filtrado de celdas y flechas por capa activa:**  
Pasar `activeLayer` al componente de tablero para que filtre:
- `visibleCells`: `scene.cells.filter(c => (c.layer ?? 0) === activeLayer)`
- `visibleArrows`: flechas cuya celda-cabeza esté en `visibleCells`

---

### Paso 9 — `src/presentation/game/levels/levelMapa3dSample.ts`

Nivel de ejemplo con los 3 grupos del spec JSON, ahora con `layer`, `portCount: 6` y
`mapMode: '3d'`. Incluir al menos 2 conexiones inter-capa (port 4 ↔ port 5) entre layers.

```typescript
export const LEVEL_3D_SAMPLE: Scene = {
  id: '3d-sample',
  mapMode: '3d',
  allowedMoves: 15,
  cells: [
    // Layer 0 — grupo 0,0 … 2,2
    { id: '0,0', col: 0, row: 0, portCount: 6, layer: 0 },
    // ... (9 celdas layer 0)
    // Layer 1 — grupo 4,3 … 6,5
    { id: '4,3', col: 4, row: 3, portCount: 6, layer: 1 },
    // ... (9 celdas layer 1)
    // Layer 2 — grupo 8,6 … 10,8
    { id: '8,6', col: 8, row: 6, portCount: 6, layer: 2 },
    // ... (9 celdas layer 2)
  ],
  connections: [
    // Conexiones planar (N/E/S/O) dentro de cada capa ...
    // Conexiones inter-capa (port 4 ↔ 5) entre capas:
    { fromCell: '2,2', fromPort: 4, toCell: '4,3', toPort: 5 },  // Layer 0 → 1
    { fromCell: '6,5', fromPort: 4, toCell: '8,6', toPort: 5 },  // Layer 1 → 2
  ],
  arrows: [],
}
```

---

## Archivos que NO se tocan

```
src/domain/**                                — Sin cambios (dominio puro)
src/application/**                           — Sin cambios
src/presentation/rendering/railGlide.ts      — Animaciones, fuera de scope
src/presentation/rendering/glideConfig.ts    — Animaciones, fuera de scope
src/presentation/rendering/arrowGlyphPath.ts — Glifo de flecha, sin cambio
src/presentation/forge/state/validateScene.ts — Validación, fuera de scope
src/presentation/forge/components/ValidationPanel.tsx
src/presentation/forge/components/PlaytestOverlay.tsx
src/presentation/forge/components/PublishPanel.tsx
src/presentation/game/GameController.ts
src/App.tsx
```

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| `sceneFromLevelData` rompe niveles 2D | `layer: c.layer ?? 0` garantiza retrocompat |
| `addCell` con mismo id pero distinto layer | Guard verifica `id AND layer` juntos |
| `rotateHead` falla si `headCell` no existe | Guard: `if (!headCell) return scene` |
| `portDelta(4/5)` en canvas de juego | `isInterLayerPort` identifica el caso; no se llama `portDelta` en esos puertos para calcular vecinos |
| Ruta exacta de `GameView` | Verificar en paso 8 antes de modificar |
| `maxLayer` no se recalcula al `removeCell` | Añadir recálculo también en `removeCell` del store |

---

## Orden de implementación (TDD)

1. `scene.ts` — tipos + serialización/deserialización
2. `boardLayout.ts` — `portDelta` + `isInterLayerPort`
3. `sceneOps.ts` — `addCell` y `rotateHead` dinámico
4. `forgeStore.ts` — `activeLayer`, `maxLayer`, `setActiveLayer`
5. `ForgeCanvas.tsx` — filtrado por capa, inter-capa dashed, ports 4/5
6. `LevelPropertiesPanel.tsx` — campo `mapMode`, info de capas
7. `ForgeApp.tsx` — barra de navegación Z, integración completa
8. `GameView` — barra Z, filtrado de celdas/flechas
9. `levelMapa3dSample.ts` — nivel de ejemplo end-to-end

---

## Criterios de completitud

- [ ] JSON con `mapMode:'3d'`, `layer` y `portCount:6` se parsea en `Scene` sin errores
- [ ] Niveles 2D existentes cargan sin errores (retrocompat garantizada)
- [ ] `portDelta(4)` y `portDelta(5)` retornan deltas diagonales; `portDelta(6)` lanza
- [ ] `isInterLayerPort(4)` y `isInterLayerPort(5)` retornan `true`
- [ ] `addCell` con `layer=1, portCount=6` crea celda correcta
- [ ] `rotateHead` en celda `portCount:6` cicla 0→1→2→3→4→5→0
- [ ] Forge muestra solo las celdas de la capa activa
- [ ] Ports 4/5 aparecen como ▲/▼ en el tile (modo connect)
- [ ] Conexiones inter-capa se renderizan como línea punteada
- [ ] Barra de capas Z visible en Forge solo cuando `mapMode:'3d'`
- [ ] GameView muestra botones ◀/▶ solo en niveles 3D
- [ ] Flechas se filtran por capa de su cabeza en el juego
- [ ] `pnpm build` sin errores TypeScript ni lint
