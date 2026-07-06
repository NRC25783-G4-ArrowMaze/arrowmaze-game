import React, { useEffect } from 'react'
import { useForgeStore } from './state/forgeStore'
import { ForgeCanvas } from './components/ForgeCanvas'

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
  const setTool = useForgeStore((s) => s.setTool)
  const selectArrow = useForgeStore((s) => s.selectArrow)
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
      // R: rotar cabeza seleccionada (TODO: cuando esté implementado)
      if (e.key === 'r' || e.key === 'R') {
        // TODO: rotateHead(selectedArrowId)
      }
      // Escape: deseleccionar
      if (e.key === 'Escape') {
        selectArrow(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedArrowId, selectArrow])

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
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            Ctrl+Z: undo | Ctrl+Shift+Z: redo | R: rotate | Esc: deselect
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

        {/* Placeholders para paneles futuros */}
        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
            [TODO: LevelPropertiesPanel - Fase 4]
          </p>
        </div>
        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
            [TODO: ValidationPanel - Fase 4]
          </p>
        </div>
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
