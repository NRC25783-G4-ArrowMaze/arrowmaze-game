import React, { useCallback } from 'react'
import type { BoardLayout, Point } from '../../rendering/boardLayout'
import { screenToCell } from '../../rendering/boardLayout'

interface UseForgeInputParams {
  width: number
  height: number
  layout: BoardLayout
  enabled: boolean
  onCellClick: (col: number, row: number) => void
}

/**
 * Convierte coordenadas de cliente a unidades del viewBox SVG.
 * (Copiado de useBoardInput.ts del cliente; patrón compartido)
 */
function toViewBoxPoint(
  event: React.PointerEvent<SVGSVGElement>,
  width: number,
  height: number,
): Point {
  const rect = event.currentTarget.getBoundingClientRect()
  const scaleX = rect.width === 0 ? 1 : width / rect.width
  const scaleY = rect.height === 0 ? 1 : height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

/**
 * useForgeInput — Adaptador de input para el canvas del editor.
 *
 * Convierte clicks (pointer down) a coordenadas de grid y dispara la acción correspondiente
 * según la herramienta activa (delegada al store).
 */
export function useForgeInput(params: UseForgeInputParams) {
  const { width, height, layout, enabled, onCellClick } = params

  return useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!enabled || event.button !== 0 || !event.isPrimary) {
        return
      }

      const point = toViewBoxPoint(event, width, height)
      const cell = screenToCell(point, layout.cellSize, layout.offset, layout.maxCol, layout.maxRow)

      if (cell) {
        onCellClick(cell.col, cell.row)
      }
    },
    [width, height, layout, enabled, onCellClick],
  )
}
