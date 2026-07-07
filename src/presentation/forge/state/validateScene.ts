import type { Scene } from '../../game/scene'
import { toLevelDataDTO } from '../../game/scene'

export interface ForgeIssue {
  severity: 'error' | 'warning'
  code: string
  message: string
}

/**
 * Valida una escena del editor contra reglas estructurales y del dominio.
 * Devuelve array de issues (errores bloquean publicación/playtest; warnings solo informativos).
 */
export function validateScene(scene: Scene): ForgeIssue[] {
  const issues: ForgeIssue[] = []

  // Error: id vacío o con espacios
  if (!scene.id || !/^\S+$/.test(scene.id)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_ID',
      message: 'ID del nivel no puede estar vacío ni contener espacios',
    })
  }

  // Error: allowedMoves no es entero positivo
  if (!Number.isInteger(scene.allowedMoves) || scene.allowedMoves <= 0) {
    issues.push({
      severity: 'error',
      code: 'INVALID_MOVES',
      message: 'Movimientos permitidos debe ser un entero > 0',
    })
  }

  // Error: sin celdas
  if (scene.cells.length === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_CELLS',
      message: 'El nivel debe tener al menos 1 celda',
    })
  }

  // Error: sin flechas (regla del dominio: un nivel debe tener al menos 1 flecha)
  if (scene.arrows.length === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_ARROWS',
      message: 'El nivel debe tener al menos 1 flecha',
    })
  }

  // Validación del dominio: intenta cargar con LevelLoader
  // (esto valida topología, conexiones, etc.)
  try {
    // Simulamos la validación intentando convertir a DTO
    // En la real se usaría LevelLoader, pero no lo importamos aquí para evitar circular deps
    const dto = toLevelDataDTO(scene)

    // Chequeos adicionales sobre el DTO
    if (!dto.id || !dto.cells || !dto.arrows) {
      issues.push({
        severity: 'error',
        code: 'MALFORMED_DTO',
        message: 'Estructura de nivel inválida (DTO malformado)',
      })
    }
  } catch (err) {
    issues.push({
      severity: 'error',
      code: 'DOMAIN_ERROR',
      message: `Error de dominio: ${err instanceof Error ? err.message : String(err)}`,
    })
  }

  // Warning: celdas sin conexión (aisladas)
  const connectedCells = new Set<string>()
  for (const conn of scene.connections) {
    connectedCells.add(conn.fromCell)
    connectedCells.add(conn.toCell)
  }
  for (const cell of scene.cells) {
    if (!connectedCells.has(cell.id)) {
      issues.push({
        severity: 'warning',
        code: 'ISOLATED_CELL',
        message: `Celda ${cell.id} no tiene conexiones (aislada)`,
      })
    }
  }

  // Warning: flechas sin cuerpo (solo cabeza)
  for (const arrow of scene.arrows) {
    if (arrow.body.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'ARROW_NO_BODY',
        message: `Flecha ${arrow.id} solo tiene cabeza, sin segmentos`,
      })
    }
  }

  return issues
}

/**
 * Devuelve true si la validación pasó (sin errores).
 */
export function isValidScene(scene: Scene): boolean {
  const issues = validateScene(scene)
  return !issues.some((i) => i.severity === 'error')
}
