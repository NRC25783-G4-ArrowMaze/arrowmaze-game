## 📋 PLAN — Vista 3D en Cascada para el Forge

### Resumen
Modificar el `ForgeCanvas` para visualizar múltiples capas Z simultáneamente (activa, Z-1 y Z+1) usando un desplazamiento isométrico, permitiendo trazar conexiones directas e interactivas entre puertos inter-capas sin perder el contexto visual.

### Gherkin asociado
features/forge-3d-view.feature — Vista en cascada y conexiones visuales entre capas.

### Archivos a crear
- `features/forge-3d-view.feature` — Escenarios de comportamiento de la vista de capas y conexiones.

### Archivos a modificar
- `src/presentation/forge/components/ForgeCanvas.tsx`
  - Renderizar `visibleCells` para incluir celdas con `layer` en `[activeLayer - 1, activeLayer, activeLayer + 1]`.
  - Crear función interna `const layerVisualOffset = (layer: number, activeLayer: number): Point => ({ x: (layer - activeLayer) * 50, y: -(layer - activeLayer) * 50 })`.
  - Sumar este offset a `cellCenter(col, row)` para *todos* los elementos (celdas, puertos, flechas, conexiones, ghosts).
  - Aplicar `opacity: layer === activeLayer ? 1.0 : 0.4` (y `pointerEvents="none"` para celdas no activas, *excepto* puertos en modo connect).
  - Modificar renderizado de conexiones (Layer 4): si `fromIsInterLayer` conecta a una capa visible, trazar línea directa punteada entre los dos `portPoint`s reales (sumando los offsets de ambas capas) en lugar de trazarla a la esquina.

### Archivos que NO se tocan
- `src/presentation/game/scene.ts`
- `src/presentation/rendering/boardLayout.ts`
- `src/presentation/components/GameView.tsx`

### Orden de implementación (TDD)
1. Modificar `ForgeCanvas.tsx` para extender `visibleCells` e incorporar `layerVisualOffset`.
2. Actualizar el render de SVG elements con el offset y opacidad.
3. Permitir interacción condicional: solo los puertos de las capas inactivas deben ser clicables si el tool es `connect`.
4. Renderizar las líneas punteadas directas de puerto a puerto si la conexión es inter-capa y ambas capas están visibles.

### Riesgos identificados
- Z-Index visual: SVG renderiza por orden de definición en el DOM. Celdas más altas podrían dibujarse antes y quedar debajo de celdas más bajas. Mitigación: ordenar `visibleCells` por `layer` ascendente (Z-1, luego Z, luego Z+1) antes de renderizarlas.
- Clicks no intencionados: celdas de diferentes capas podrían solaparse. Mitigación: `pointerEvents="none"` en celdas inactivas.

### Criterios de completitud
- [ ] La UI permite ver hasta 3 capas a la vez con desplazamiento isométrico.
- [ ] Al conectar capa 0 con capa 1, se ve una línea punteada conectando ambos puertos visualmente.
- [ ] Las celdas y flechas de capas inactivas tienen baja opacidad.
