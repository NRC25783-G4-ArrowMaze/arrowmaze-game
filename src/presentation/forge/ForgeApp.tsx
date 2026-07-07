import React, { useEffect } from 'react'
import { useForgeStore, type ToolMode } from './state/forgeStore'
import { ForgeCanvas } from './components/ForgeCanvas'
import { LevelPropertiesPanel } from './components/LevelPropertiesPanel'
import { ValidationPanel } from './components/ValidationPanel'

const TOOL_HINTS: Record<ToolMode, string> = {
  select: 'Clic en una flecha para seleccionarla. R rota su cabeza.',
  cell: 'Clic en un slot vacío para crear celda; clic en celda existente para borrarla.',
  connect: 'Clic en un puerto (N/E/S/O) de una celda y luego en un puerto de otra. Cualquier par sirve.',
  arrowHead: 'Clic en una celda libre para colocar la cabeza de una flecha.',
  extend: 'Selecciona una flecha (clic) y luego clic en una celda conectada resaltada para extenderla.',
  erase: 'Clic en una flecha para eliminarla.',
}

/**
 * ForgeApp — Shell principal del editor de niveles.
 *
 * Layout de 2 columnas:
 *  - Izquierda: toolbar + lienzo SVG
 *  - Derecha: paneles de propiedades, validación, publicación (TODO: Fase 4+)
 *
 * Gestiona atajos globales (R, Ctrl+Z, Ctrl+Shift+Z, Escape).
 */
const ForgeApp: React.FC = () => {
  const scene = useForgeStore((s) => s.scene)
  const gridCols = useForgeStore((s) => s.gridCols)
  const gridRows = useForgeStore((s) => s.gridRows)
  const tool = useForgeStore((s) => s.tool)
  const selectedArrowId = useForgeStore((s) => s.selectedArrowId)
  const history = useForgeStore((s) => s.history)
  const setTool = useForgeStore((s) => s.setTool)
  const setGridCols = useForgeStore((s) => s.setGridCols)
  const setGridRows = useForgeStore((s) => s.setGridRows)
  const selectArrow = useForgeStore((s) => s.selectArrow)
  const setPendingConnect = useForgeStore((s) => s.setPendingConnect)
  const rotateHead = useForgeStore((s) => s.rotateHead)
  const setLevelProps = useForgeStore((s) => s.setLevelProps)
  const undo = useForgeStore((s) => s.undo)
  const redo = useForgeStore((s) => s.redo)

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z: undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Shift+Z (o Cmd+Shift+Z): redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
      // R: rotar cabeza seleccionada
      if ((e.key === 'r' || e.key === 'R') && selectedArrowId) {
        e.preventDefault()
        rotateHead(selectedArrowId)
      }
      // Escape: deseleccionar y cancelar conexión pendiente
      if (e.key === 'Escape') {
        selectArrow(null)
        setPendingConnect(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedArrowId, selectArrow, setPendingConnect, rotateHead])

  return (
    <div style={{ display: 'flex', height: '100vh', gap: '16px', padding: '16px' }}>
      {/* Columna izquierda: toolbar + lienzo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Toolbar (Fase 2+) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            alignItems: 'center',
          }}
        >
          <label>Herramienta:</label>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value as any)}
            style={{ padding: '4px' }}
          >
            <option value="select">Select</option>
            <option value="cell">Cell</option>
            <option value="connect">Connect</option>
            <option value="arrowHead">Arrow Head</option>
            <option value="extend">Extend</option>
            <option value="erase">Erase</option>
          </select>
          <span style={{ fontSize: '12px', color: '#0369a1' }}>{TOOL_HINTS[tool]}</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            Ctrl+Z: undo ({history.past.length}) | Ctrl+Shift+Z: redo ({history.future.length}) | R: rotate | Esc: deselect
          </span>
        </div>

        {/* Lienzo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ForgeCanvas
            scene={scene}
            gridCols={gridCols}
            gridRows={gridRows}
            selectedArrowId={selectedArrowId}
          />
        </div>
      </div>

      {/* Columna derecha: paneles (TODO: Fases 4+) */}
      <div
        style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Nivel: {scene.id}</h3>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            Celdas: {scene.cells.length} | Flechas: {scene.arrows.length}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            Movimientos permitidos: {scene.allowedMoves}
          </p>
        </div>

        {/* Panel de Propiedades */}
        <LevelPropertiesPanel
          scene={scene}
          gridCols={gridCols}
          gridRows={gridRows}
          onSceneUpdate={setLevelProps}
          onGridUpdate={(cols, rows) => {
            setGridCols(cols)
            setGridRows(rows)
          }}
        />

        {/* Panel de Validación */}
        <ValidationPanel scene={scene} />

        {/* TODO: PublishPanel - Fase 6 */}
        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
            [TODO: PublishPanel - Fase 6]
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgeApp
