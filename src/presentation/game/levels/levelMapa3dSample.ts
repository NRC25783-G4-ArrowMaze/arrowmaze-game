import type { Scene } from '../scene';

/**
 * Nivel de ejemplo 3D con 3 capas (layer 0, 1, 2) y conexiones inter-capa (ports 4 y 5).
 * Basado en el spec JSON proporcionado en el feature request de Mapas 3D.
 */
export const LEVEL_3D_SAMPLE: Scene = {
  id: '3d-sample',
  mapMode: '3d',
  allowedMoves: 15,
  collisionBehavior: 'return',
  cells: [
    // --- Capa 0 ---
    { id: '0,0', col: 0, row: 0, portCount: 6, layer: 0 },
    { id: '0,1', col: 0, row: 1, portCount: 6, layer: 0 },
    { id: '0,2', col: 0, row: 2, portCount: 6, layer: 0 },
    { id: '1,0', col: 1, row: 0, portCount: 6, layer: 0 },
    { id: '1,1', col: 1, row: 1, portCount: 6, layer: 0 },
    { id: '1,2', col: 1, row: 2, portCount: 6, layer: 0 },
    { id: '2,0', col: 2, row: 0, portCount: 6, layer: 0 },
    { id: '2,1', col: 2, row: 1, portCount: 6, layer: 0 },
    { id: '2,2', col: 2, row: 2, portCount: 6, layer: 0 },

    // --- Capa 1 ---
    { id: '4,3', col: 4, row: 3, portCount: 6, layer: 1 },
    { id: '4,4', col: 4, row: 4, portCount: 6, layer: 1 },
    { id: '4,5', col: 4, row: 5, portCount: 6, layer: 1 },
    { id: '5,3', col: 5, row: 3, portCount: 6, layer: 1 },
    { id: '5,4', col: 5, row: 4, portCount: 6, layer: 1 },
    { id: '5,5', col: 5, row: 5, portCount: 6, layer: 1 },
    { id: '6,3', col: 6, row: 3, portCount: 6, layer: 1 },
    { id: '6,4', col: 6, row: 4, portCount: 6, layer: 1 },
    { id: '6,5', col: 6, row: 5, portCount: 6, layer: 1 },

    // --- Capa 2 ---
    { id: '8,6', col: 8, row: 6, portCount: 6, layer: 2 },
    { id: '8,7', col: 8, row: 7, portCount: 6, layer: 2 },
    { id: '8,8', col: 8, row: 8, portCount: 6, layer: 2 },
    { id: '9,6', col: 9, row: 6, portCount: 6, layer: 2 },
    { id: '9,7', col: 9, row: 7, portCount: 6, layer: 2 },
    { id: '9,8', col: 9, row: 8, portCount: 6, layer: 2 },
    { id: '10,6', col: 10, row: 6, portCount: 6, layer: 2 },
    { id: '10,7', col: 10, row: 7, portCount: 6, layer: 2 },
    { id: '10,8', col: 10, row: 8, portCount: 6, layer: 2 },
  ],
  connections: [
    // Conexiones planas (N/E/S/O) en Capa 0
    { fromCell: '0,0', fromPort: 2, toCell: '0,1', toPort: 0 },
    { fromCell: '0,1', fromPort: 2, toCell: '0,2', toPort: 0 },
    { fromCell: '1,0', fromPort: 2, toCell: '1,1', toPort: 0 },
    { fromCell: '1,1', fromPort: 2, toCell: '1,2', toPort: 0 },
    { fromCell: '2,0', fromPort: 2, toCell: '2,1', toPort: 0 },
    { fromCell: '2,1', fromPort: 2, toCell: '2,2', toPort: 0 },
    { fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 3 },
    { fromCell: '1,0', fromPort: 1, toCell: '2,0', toPort: 3 },
    { fromCell: '0,1', fromPort: 1, toCell: '1,1', toPort: 3 },
    { fromCell: '1,1', fromPort: 1, toCell: '2,1', toPort: 3 },
    { fromCell: '0,2', fromPort: 1, toCell: '1,2', toPort: 3 },
    { fromCell: '1,2', fromPort: 1, toCell: '2,2', toPort: 3 },

    // Conexiones planas (N/E/S/O) en Capa 1
    { fromCell: '4,3', fromPort: 2, toCell: '4,4', toPort: 0 },
    { fromCell: '4,4', fromPort: 2, toCell: '4,5', toPort: 0 },
    { fromCell: '5,3', fromPort: 2, toCell: '5,4', toPort: 0 },
    { fromCell: '5,4', fromPort: 2, toCell: '5,5', toPort: 0 },
    { fromCell: '6,3', fromPort: 2, toCell: '6,4', toPort: 0 },
    { fromCell: '6,4', fromPort: 2, toCell: '6,5', toPort: 0 },
    { fromCell: '4,3', fromPort: 1, toCell: '5,3', toPort: 3 },
    { fromCell: '5,3', fromPort: 1, toCell: '6,3', toPort: 3 },
    { fromCell: '4,4', fromPort: 1, toCell: '5,4', toPort: 3 },
    { fromCell: '5,4', fromPort: 1, toCell: '6,4', toPort: 3 },
    { fromCell: '4,5', fromPort: 1, toCell: '5,5', toPort: 3 },
    { fromCell: '5,5', fromPort: 1, toCell: '6,5', toPort: 3 },

    // Conexiones planas (N/E/S/O) en Capa 2
    { fromCell: '8,6', fromPort: 2, toCell: '8,7', toPort: 0 },
    { fromCell: '8,7', fromPort: 2, toCell: '8,8', toPort: 0 },
    { fromCell: '9,6', fromPort: 2, toCell: '9,7', toPort: 0 },
    { fromCell: '9,7', fromPort: 2, toCell: '9,8', toPort: 0 },
    { fromCell: '10,6', fromPort: 2, toCell: '10,7', toPort: 0 },
    { fromCell: '10,7', fromPort: 2, toCell: '10,8', toPort: 0 },
    { fromCell: '8,6', fromPort: 1, toCell: '9,6', toPort: 3 },
    { fromCell: '9,6', fromPort: 1, toCell: '10,6', toPort: 3 },
    { fromCell: '8,7', fromPort: 1, toCell: '9,7', toPort: 3 },
    { fromCell: '9,7', fromPort: 1, toCell: '10,7', toPort: 3 },
    { fromCell: '8,8', fromPort: 1, toCell: '9,8', toPort: 3 },
    { fromCell: '9,8', fromPort: 1, toCell: '10,8', toPort: 3 },

    // Conexiones inter-capa (port 4 ↔ 5)
    // De Capa 0 a Capa 1
    { fromCell: '2,2', fromPort: 4, toCell: '4,3', toPort: 5 },
    // De Capa 1 a Capa 2
    { fromCell: '6,5', fromPort: 4, toCell: '8,6', toPort: 5 },
  ],
  arrows: [
    {
      id: 'a1',
      color: '#3b82f6', // azul
      head: { cellId: '0,0', exitPort: 2 },
      body: [],
    }
  ],
};
