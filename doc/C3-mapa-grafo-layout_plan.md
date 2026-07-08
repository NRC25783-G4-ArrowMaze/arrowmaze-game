# Plan — C3 iteración 2: layout de grafo curvo/zigzag con aristas visibles

## Context

**Qué ya existe (iteración 1, commit `677180d3`).** C3 está implementado como **grid funcional**:
`LevelSelectionProjection` deriva estados (bloqueado/disponible/completado, focal, estrellas) de forma
pura, `LEVEL_MAP` declara la topología con `prerequisites` + `pathHint {x,y}` (0–100) + `starThresholds`,
y `LevelSelectScreen` pinta un CSS grid de `LevelNodeCard`. Todo verde y navegable.

**Qué falta (esta iteración).** La regla de la spec **"Representación visual del grafo"**
([C3-seleccion-niveles-progreso.feature](../../../Develop/arrowmaze-project-core/features/C3-seleccion-niveles-progreso.feature) líneas 273–296)
aún no se cumple visualmente: hoy los nodos van en grid recto y **no se dibujan aristas**. El `pathHint`
se modela pero **no se usa para posicionar**. Los tres Scenarios pendientes:
- *"Cada estado tiene affordance visual distinta"* — bloqueado a menor escala + candado; focal a mayor
  escala + resalte/pulso; completado con métricas anidadas (parcialmente cubierto por la card actual).
- *"Las aristas comunican si el recorrido es lineal o ramificado"* — dibujar aristas prereq→nodo; la
  bifurcación de L1 hacia L2 y L3 debe verse como dos caminos.
- *"Los nodos siguen un flujo espacial no recto"* — distribuir por `pathHint` en un camino curvo/zigzag,
  no una fila recta. **Invariante:** `pathHint` es **puramente visual**, no altera estado ni desbloqueo.

**Resultado buscado.** Un mapa-recorrido tipo *journey*: **pines circulares** posicionados por `pathHint`
a lo largo de un camino sinuoso con **scroll vertical**, unidos por **aristas curvas** cuyo estilo refleja
el progreso. Reemplaza el grid actual.

## Decisiones de diseño (confirmadas con el usuario)

- **Nodos:** **pines circulares** estilo mapa (Candy-Crush): círculo con índice/check, estrellas encima,
  nombre debajo, score pequeño. Reemplaza el look de tarjeta rectangular.
- **Lienzo:** **scroll vertical** — el recorrido fluye de arriba abajo; si excede el viewport, hace scroll.
  `pathHint.y` = avance a lo largo del recorrido; `pathHint.x` = zigzag horizontal. Nunca scroll horizontal.

## Enfoque técnico

Consistente con el resto del cliente (**render = SVG**, ver `BoardComponent`). Mapa **híbrido de 2 capas**
dentro de un contenedor `position: relative`:

1. **Capa de aristas (SVG, detrás).** Un `<svg>` que llena el contenedor y dibuja una `<path>` cúbica
   (bézier) por cada par `(nodo, prerequisito)`, del centro del prereq al centro del nodo. Puntos de
   control desplazados en vertical → curva suave; dos aristas saliendo de L1 hacen visible la bifurcación.
2. **Capa de nodos (HTML, encima).** Cada pin `position: absolute` en su centro en px
   (`left`, `top` + `translate(-50%,-50%)`). Reutiliza el estado ya derivado para el estilo.

**Separación de responsabilidades (clave del invariante):** la **geometría** (posiciones + aristas) sale
del catálogo `LEVEL_MAP` (`pathHint` + `prerequisites`); el **estilo** de cada pin/arista sale de
`DerivedNode` (`LevelSelectionProjection`). Así `pathHint` nunca entra en la proyección → sigue siendo
puramente visual, y la proyección sigue determinista e ignorante de la disposición.

### 1. Geometría pura — `src/presentation/game/levelMapLayout.ts` (nuevo)
Utilidad de layout pura y testeable (análoga a [`boardLayout.ts`](src/presentation/rendering/boardLayout.ts)):
- `computeMapLayout(nodes: LevelMapDTO, width: number): MapLayout` → `{ width, height, centers: Map<levelId, Point> }`.
  - `center.x = (pathHint.x/100) * (width - 2*PAD) + PAD` (clamp con radio del pin para no cortar).
  - `center.y = (pathHint.y/maxY) * heightPx`, con `heightPx = maxY-normalizado * VERTICAL_SPAN` para dar
    aire entre pasos (scroll si supera el viewport). Nodo sin `pathHint` → fallback a un layout en cadena por índice.
- `edgePaths(nodes, centers): EdgePath[]` → una entrada por arista `(prereqId → nodeId)` con el `d` de una
  bézier cúbica entre ambos centros. Un prerequisito **ausente del catálogo se omite sin error** (a prueba
  de fallos, coherente con la proyección). Cada `EdgePath` lleva `{ fromId, toId, d }` para que la capa de
  render decida el estilo según los estados.

### 2. Pin de nodo — `src/presentation/game/LevelNodePin.tsx` (nuevo, reemplaza a `LevelNodeCard`)
Círculo con affordance por estado (mapea los Scenarios "affordance visual distinta"):
- **bloqueado:** escala ~0.85, muteado, 🔒, `cursor: not-allowed`; click → `alert(t('c3.locked.notice'))`
  (reutiliza el comportamiento actual de la card; **no** navega — Scenario "tocar nodo bloqueado").
- **disponible (no focal):** escala 1, color de acento suave, clickable → `onSelectLevel`.
- **focal:** escala ~1.15, anillo/resalte + **pulso** (requiere definir `@keyframes pulse`, hoy referenciado
  pero inexistente — bug a corregir).
- **completado:** ✓ + estrellas (`★` × `node.stars`) encima + `score` pequeño debajo. Sin `starThresholds`
  → sin estrellas (solo check + score). Nodo no jugado → sin métricas.
- **nombre** del nivel debajo, mostrado **crudo** (P24); etiquetas de UI vía `t()` (i18n scaffold existente).

### 3. Pantalla — `src/presentation/game/LevelSelectScreen.tsx` (modificar)
Sustituir el CSS grid por el mapa:
- Contenedor scroll `.level-map-scroll` (`overflow-y: auto`, `max-height` = viewport bajo el header) y dentro
  `.level-map` (`position: relative`, `width` responsivo ~`min(100%, 480px)`, `height` = `layout.height`).
- Ejecutar `computeMapLayout(LEVEL_MAP, width)` + `edgePaths(...)`. Render:
  - `<svg>` de aristas (detrás), pintando cada `EdgePath` con estilo según estados de sus extremos:
    ambos `completado` → arista "recorrida" (sólida, acento); destino `disponible` → "siguiente" (sólida
    neutra); destino `bloqueado` → "pendiente" (punteada, atenuada).
  - Los pines encima, uno por `DerivedNode`, posicionados con `layout.centers`.
- Mantiene el `useEffect` que corre la proyección sobre `progress` (sin cambios de lógica).

### 4. Datos y estilos
- `src/presentation/game/levelMap.ts` — los `pathHint` actuales (x: 50/20/80/50/50, y: 20/50/50/80/100)
  ya producen zigzag + bifurcación; ajustar `VERTICAL_SPAN`/valores solo si los pines se solapan.
- `src/App.css` — añadir bloque `.level-map*` (contenedor, scroll, pin por estado, aristas) y el
  `@keyframes pulse` faltante. Ajustar el wrapper del branch `SELECT` para que el mapa **estire a lo ancho
  y gestione su propio scroll** (hoy `.app-main` centra con `align-items:center`, que recortaría un mapa
  alto): que `.level-select-screen` haga `align-self: stretch; width: 100%`.

### 5. Limpieza
- Eliminar `src/presentation/game/LevelNodeCard.tsx` (superado por el pin) — un concern por commit,
  coherente con la práctica de commits modulares del repo. Verificar que nadie más lo importe.

## Archivos

**Nuevos:**
- `src/presentation/game/levelMapLayout.ts` — geometría pura (posiciones + aristas bézier).
- `src/presentation/game/levelMapLayout.test.ts` — tests de la geometría.
- `src/presentation/game/LevelNodePin.tsx` — pin circular por estado.

**Modificados:**
- `src/presentation/game/LevelSelectScreen.tsx` — mapa SVG-aristas + pines posicionados (reemplaza grid).
- `src/App.css` — estilos `.level-map*`, `@keyframes pulse`, stretch del branch SELECT.
- `src/presentation/game/levelMap.ts` — (posible) ajuste fino de `pathHint`/spacing.

**Eliminados:**
- `src/presentation/game/LevelNodeCard.tsx` — superado por `LevelNodePin`.

**Reutilizados (no reescribir):**
- [`LevelSelectionProjection.project()`](src/domain/services/LevelSelectionProjection.ts) — estados/focal/estrellas (sin cambios).
- `DerivedNode` (mismo shape) y `LEVEL_MAP` (`pathHint`/`prerequisites`) — fuentes de estilo y geometría.
- [`t()`](src/presentation/i18n/i18n.ts) — textos de UI. Convención SVG de [`BoardComponent`](src/presentation/components/BoardComponent.tsx).

## Tests (vitest, patrón existente)

- **`levelMapLayout.test.ts`** (núcleo, sin DOM):
  - `computeMapLayout`: `pathHint` → centros en px; `y` monótona hacia abajo; `x` produce zigzag (no todos
    iguales); determinismo (misma entrada → misma salida).
  - `edgePaths`: una arista por par prereq→nodo; **L1 genera dos aristas salientes** (→L2, →L3, bifurcación);
    prerequisito fantasma → **omitido sin lanzar**; cada `d` es una cadena de path válida no vacía.
  - **`pathHint` puramente visual:** alterar `pathHint` cambia los centros pero **no** cambia ningún
    `DerivedNode.state` (aserción cruzada layout↔proyección).
- La suite existente `LevelSelectionProjection.test.ts` debe seguir verde (no se toca la proyección).

## Verificación end-to-end

1. `npm run type-check` — sin errores.
2. `npm run dev` y revisar en el navegador (partiendo de instalación limpia):
   - Nodos en **camino sinuoso** (no fila recta); **aristas curvas** visibles; **bifurcación** de L1 hacia
     L2 y L3 como dos caminos.
   - Estados: L1 focal con **pulso** y mayor escala; L2/L3/L4/L5 bloqueados a menor escala con 🔒 y aristas
     punteadas/atenuadas.
   - Ganar L1 → vuelve al mapa: L1 `completado` (✓ + estrellas + score), aristas L1→L2/L3 pasan a estilo
     "recorrida/siguiente", nuevo focal en L2.
   - Tocar un pin bloqueado → aviso i18n, **sin** navegación.
   - Ventana baja → aparece **scroll vertical**; nunca scroll horizontal.
3. `npx vitest run src/presentation/game/levelMapLayout.test.ts` — verde.

## Fuera de alcance (siguientes iteraciones)

- G2: cambio de idioma real ES/EN (solo queda el scaffold `t()`).
- Refresco remoto F2 del catálogo (nodos nuevos en caliente).
- Animación de transición al entrar/salir del nivel; navegación por teclado en los pines (nice-to-have).
