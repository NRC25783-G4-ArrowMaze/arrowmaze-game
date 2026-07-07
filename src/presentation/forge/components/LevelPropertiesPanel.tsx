import React from 'react'
import type { Scene } from '../../game/scene'

interface LevelPropertiesPanelProps {
  scene: Scene
  gridCols: number
  gridRows: number
  onSceneUpdate: (updates: Partial<Scene>) => void
  onGridUpdate: (cols: number, rows: number) => void
}

export const LevelPropertiesPanel: React.FC<LevelPropertiesPanelProps> = ({
  scene,
  gridCols,
  gridRows,
  onSceneUpdate,
  onGridUpdate,
}) => {
  const handleIdChange = (newId: string) => {
    onSceneUpdate({ id: newId })
  }

  const handleNameChange = (newName: string) => {
    onSceneUpdate({ name: newName })
  }

  const handleDifficultyChange = (newDiff: string) => {
    onSceneUpdate({ difficulty: newDiff })
  }

  const handleMovesChange = (newMoves: number) => {
    onSceneUpdate({ allowedMoves: newMoves })
  }

  const handleGridColsChange = (newCols: number) => {
    if (newCols < 1) return
    // Verificar que no dejaría celdas fuera
    const maxCol = Math.max(0, ...scene.cells.map((c) => c.col))
    if (maxCol >= newCols) {
      alert(`Reducir a ${newCols} columnas dejaría celdas fuera (máx col: ${maxCol})`)
      return
    }
    onGridUpdate(newCols, gridRows)
  }

  const handleGridRowsChange = (newRows: number) => {
    if (newRows < 1) return
    const maxRow = Math.max(0, ...scene.cells.map((c) => c.row))
    if (maxRow >= newRows) {
      alert(`Reducir a ${newRows} filas dejaría celdas fuera (máx row: ${maxRow})`)
      return
    }
    onGridUpdate(gridCols, newRows)
  }

  return (
    <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Propiedades del Nivel</h4>

      {/* ID */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          ID
        </label>
        <input
          type="text"
          value={scene.id}
          onChange={(e) => handleIdChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
          placeholder="ej: level-01"
        />
      </div>

      {/* Nombre */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Nombre (opcional)
        </label>
        <input
          type="text"
          value={scene.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
          placeholder="ej: Los Portales"
        />
      </div>

      {/* Dificultad */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Dificultad (opcional)
        </label>
        <select
          value={scene.difficulty || ''}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
        >
          <option value="">—</option>
          <option value="easy">Fácil</option>
          <option value="medium">Medio</option>
          <option value="hard">Difícil</option>
        </select>
      </div>

      {/* Movimientos permitidos */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Movimientos permitidos
        </label>
        <input
          type="number"
          min="1"
          value={scene.allowedMoves}
          onChange={(e) => handleMovesChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Grid size */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Tamaño del lienzo
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              min="1"
              value={gridCols}
              onChange={(e) => handleGridColsChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>cols</div>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>×</div>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              min="1"
              value={gridRows}
              onChange={(e) => handleGridRowsChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>rows</div>
          </div>
        </div>
      </div>
    </div>
  )
}
