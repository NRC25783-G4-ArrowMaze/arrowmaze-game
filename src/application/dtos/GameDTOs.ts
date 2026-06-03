/**
 * CellDTO — representación serializable de una celda del grafo.
 * No contiene posición cartesiana ni dirección; la topología se define por puertos.
 */
export interface CellDTO {
  id: string;
  portCount: number;
  isOccupied: boolean;
}

/**
 * ConnectionDTO — representa un enlace bidireccional entre dos puertos.
 * fromCellId.fromPort ↔ toCellId.toPort
 */
export interface ConnectionDTO {
  fromCellId: string;
  fromPort: number;
  toCellId: string;
  toPort: number;
}

/**
 * LoadLevelResult — resultado del caso de uso LoadLevel.
 * Devuelve el grafo topológico completo del nivel.
 */
export interface LoadLevelResult {
  success: boolean;
  levelId: string;
  cells: CellDTO[];
  connections: ConnectionDTO[];
  error?: string;
}

