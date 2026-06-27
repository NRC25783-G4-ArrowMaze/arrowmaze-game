import type { Scene } from '../game/scene'

/**
 * MOCK_SCENE — Escena de PRUEBA para la página oculta de preview.
 *
 * Reproduce el mapa pedido (grilla 3×3, convención de puertos 0=N,1=E,2=S,3=O):
 *
 *     - - >        fila 0: flecha horizontal, punta al Este en (2,0)
 *     . > ^        fila 1: (0,1) vacío, flecha al Este en (1,1), punta al Norte en (2,1)
 *     - - c        fila 2: cuerpo horizontal + CURVA en (2,2)
 *
 * Tres flechas-neón:
 *   - magenta: horizontal por la fila superior, avanza al Este.
 *   - cyan:    arranca abajo-izquierda, dobla en la curva (2,2) y sube → punta al Norte.
 *   - yellow:  una sola celda en el centro, apunta al Este.
 *
 * La grilla está totalmente conectada (cumpliendo la regla de puertos opuestos del
 * dominio), así que el motor la construye y la juega; haz click en una flecha para avanzarla.
 */

const PORTS = 4

function gridCells() {
  const cells = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({ id: `${col},${row}`, col, row, portCount: PORTS })
    }
  }
  return cells
}

function gridConnections() {
  const connections = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const id = `${col},${row}`
      if (col < 2) {
        connections.push({ fromCell: id, fromPort: 1, toCell: `${col + 1},${row}`, toPort: 3 })
      }
      if (row < 2) {
        connections.push({ fromCell: id, fromPort: 2, toCell: `${col},${row + 1}`, toPort: 0 })
      }
    }
  }
  return connections
}

export const MOCK_SCENE: Scene = {
  id: 'mock-arrow-shape',
  allowedMoves: 20,
  cells: gridCells(),
  connections: gridConnections(),
  arrows: [
    // Magenta: fila superior "-->", punta al Este en (2,0).
    { id: 'magenta', color: '#ff2bd6', head: { cellId: '0,0', exitPort: 1 }, body: ['1,0', '2,0'] },
    // Cyan: "--c" abajo y curva que sube; punta al Norte "^" en (2,1).
    { id: 'cyan', color: '#21e6ff', head: { cellId: '0,2', exitPort: 1 }, body: ['1,2', '2,2', '2,1'] },
    // Yellow: una sola celda ">" en el centro (1,1), apunta al Este.
    { id: 'yellow', color: '#ffe23b', head: { cellId: '1,1', exitPort: 1 }, body: [] },
  ],
}
