import React from 'react'
import { isValidScene, validateScene } from '../state/validateScene'
import type { Scene } from '../../game/scene'

interface ValidationPanelProps {
  scene: Scene
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ scene }) => {
  const issues = React.useMemo(() => {
    return validateScene(scene)
  }, [scene.id, scene.allowedMoves, scene.cells.length, scene.arrows.length, scene.connections.length])

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const isValid = isValidScene(scene)

  return (
    <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
      <div style={{ marginBottom: '12px' }}>
        {isValid ? (
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>
            ✓ Nivel válido
          </div>
        ) : (
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>
            ✗ Errores de validación ({errorCount})
          </div>
        )}
        {warningCount > 0 && (
          <div style={{ fontSize: '12px', color: '#ea580c', marginTop: '4px' }}>
            ⚠ {warningCount} advertencia{warningCount === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {/* Lista de issues */}
      {issues.length > 0 && (
        <div style={{ fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          {issues.map((issue, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: issue.severity === 'error' ? '#fee2e2' : '#fef3c7',
                border:
                  issue.severity === 'error'
                    ? '1px solid #fca5a5'
                    : '1px solid #fcd34d',
                borderRadius: '3px',
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  color: issue.severity === 'error' ? '#991b1b' : '#92400e',
                  fontSize: '11px',
                  marginBottom: '2px',
                }}
              >
                {issue.severity === 'error' ? '❌' : '⚠️'} {issue.code}
              </div>
              <div style={{ color: issue.severity === 'error' ? '#7f1d1d' : '#78350f', fontSize: '11px' }}>
                {issue.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <div style={{ fontSize: '12px', color: '#999' }}>
          (sin issues)
        </div>
      )}
    </div>
  )
}
