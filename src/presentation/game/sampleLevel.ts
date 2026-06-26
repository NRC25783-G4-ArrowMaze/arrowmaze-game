import type { Scene, SceneCell } from './scene';
import type { LevelConnectionDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';

/**
 * sampleLevel — Nivel de ejemplo (escena de presentación) para demostrar B3/B2/B4.
 *
 * Es una grilla 6×6 totalmente conectada (celdas de 4 puertos). El id de cada
 * celda es su propia posición "col,row", de modo que invertir el toque a (col,row)
 * basta para resolver el id de celda.
 *
 * Las tres flechas están dispuestas para exhibir los tres outcomes del motor:
 *   - "blue":   avanza al Norte sin obstáculos (y al llegar al borde, se destruye).
 *   - "green":  su cabeza apunta al Este, hacia la celda que ocupa "orange" → bloqueada.
 *   - "orange": avanza al Sur sin obstáculos.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 *
 * GEOMETRÍA DEL MOTOR: el cuerpo se dispone en la dirección del exitPort (adelante
 * de la cabeza, en el sentido de avance), no detrás. La flecha se desliza hacia su
 * exitPort y el cuerpo la sigue celda a celda.
 */

const COLS = 6;
const ROWS = 6;

function buildGridCells(): SceneCell[] {
  const cells: SceneCell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ id: `${col},${row}`, col, row, portCount: 4 });
    }
  }
  return cells;
}

function buildGridConnections(): LevelConnectionDTO[] {
  const connections: LevelConnectionDTO[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = `${col},${row}`;
      // Este (puerto 1) ↔ Oeste (puerto 3) del vecino a la derecha.
      if (col < COLS - 1) {
        connections.push({
          fromCell: id,
          fromPort: 1,
          toCell: `${col + 1},${row}`,
          toPort: 3,
        });
      }
      // Sur (puerto 2) ↔ Norte (puerto 0) del vecino de abajo.
      if (row < ROWS - 1) {
        connections.push({
          fromCell: id,
          fromPort: 2,
          toCell: `${col},${row + 1}`,
          toPort: 0,
        });
      }
    }
  }
  return connections;
}

export const SAMPLE_LEVEL: Scene = {
  id: 'demo-6x6',
  allowedMoves: 30,
  cells: buildGridCells(),
  connections: buildGridConnections(),
  arrows: [
    // Azul: cabeza al Norte, cuerpo adelante (4,1). Avanza N libre; al borde → se destruye.
    {
      id: 'blue',
      color: '#3b82f6',
      head: { cellId: '4,2', exitPort: 0 },
      body: ['4,1'],
    },
    // Verde: cabeza al Este (solo cabeza). Su destino (2,2) lo ocupa "orange" → bloqueada.
    {
      id: 'green',
      color: '#22c55e',
      head: { cellId: '1,2', exitPort: 1 },
      body: [],
    },
    // Naranja: cabeza al Sur, cuerpo adelante (2,3). Avanza S libre; y es el "muro" de la verde.
    {
      id: 'orange',
      color: '#f97316',
      head: { cellId: '2,2', exitPort: 2 },
      body: ['2,3'],
    },
  ],
};
