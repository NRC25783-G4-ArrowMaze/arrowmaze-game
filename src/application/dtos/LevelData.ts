/**
 * LevelData — Contrato de datos serializable de un nivel (capa de aplicación).
 *
 * Vive en la capa de APLICACIÓN (no en infraestructura) porque es el contrato
 * que cruza los puertos: los repositorios lo devuelven y los casos de uso lo
 * consumen. Infraestructura DEPENDE de este contrato (apunta hacia adentro),
 * nunca al revés. Así se respeta la Regla de Dependencia de Clean Architecture.
 */

/** Describe una celda del nivel en formato serializable. */
export interface CellData {
  id: string;
  portCount: number;
}

/** Describe un enlace bidireccional entre dos puertos de celdas. */
export interface ConnectionData {
  fromCell: string;
  fromPort: number;
  toCell: string;
  toPort: number;
}

/** Estructura raw de un nivel (schema simple y extensible). */
export interface LevelData {
  id: string;
  name: string;
  difficulty: string;
  allowedMoves: number;
  cells: CellData[];
  connections: ConnectionData[];
}