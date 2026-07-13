import type { LevelDataDTO } from '../../../application/dtos/LevelDataDTOs';

export const LEVEL_CUBE: LevelDataDTO = {
  "id": "level-cube",
  "name": "Cube",
  "difficulty": "hard",
  "allowedMoves": 12,
  "mapMode": "3d",
  "collisionBehavior": "return",
  "cells": [
    {
      "id": "0,0_Z0",
      "col": 0,
      "row": 0,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "1,0_Z0",
      "col": 1,
      "row": 0,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "2,0_Z0",
      "col": 2,
      "row": 0,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "0,1_Z0",
      "col": 0,
      "row": 1,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "1,1_Z0",
      "col": 1,
      "row": 1,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "2,1_Z0",
      "col": 2,
      "row": 1,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "0,2_Z0",
      "col": 0,
      "row": 2,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "1,2_Z0",
      "col": 1,
      "row": 2,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "2,2_Z0",
      "col": 2,
      "row": 2,
      "layer": 0,
      "portCount": 6
    },
    {
      "id": "0,0_Z1",
      "col": 0,
      "row": 0,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "1,0_Z1",
      "col": 1,
      "row": 0,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "2,0_Z1",
      "col": 2,
      "row": 0,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "0,1_Z1",
      "col": 0,
      "row": 1,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "1,1_Z1",
      "col": 1,
      "row": 1,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "2,1_Z1",
      "col": 2,
      "row": 1,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "0,2_Z1",
      "col": 0,
      "row": 2,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "1,2_Z1",
      "col": 1,
      "row": 2,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "2,2_Z1",
      "col": 2,
      "row": 2,
      "layer": 1,
      "portCount": 6
    },
    {
      "id": "0,0_Z2",
      "col": 0,
      "row": 0,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "1,0_Z2",
      "col": 1,
      "row": 0,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "2,0_Z2",
      "col": 2,
      "row": 0,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "0,1_Z2",
      "col": 0,
      "row": 1,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "1,1_Z2",
      "col": 1,
      "row": 1,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "2,1_Z2",
      "col": 2,
      "row": 1,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "0,2_Z2",
      "col": 0,
      "row": 2,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "1,2_Z2",
      "col": 1,
      "row": 2,
      "layer": 2,
      "portCount": 6
    },
    {
      "id": "2,2_Z2",
      "col": 2,
      "row": 2,
      "layer": 2,
      "portCount": 6
    }
  ],
  "connections": [
    {
      "fromCell": "0,0_Z0",
      "fromPort": 1,
      "toCell": "1,0_Z0",
      "toPort": 3
    },
    {
      "fromCell": "0,0_Z0",
      "fromPort": 2,
      "toCell": "0,1_Z0",
      "toPort": 0
    },
    {
      "fromCell": "0,0_Z0",
      "fromPort": 4,
      "toCell": "0,0_Z1",
      "toPort": 5
    },
    {
      "fromCell": "1,0_Z0",
      "fromPort": 1,
      "toCell": "2,0_Z0",
      "toPort": 3
    },
    {
      "fromCell": "1,0_Z0",
      "fromPort": 2,
      "toCell": "1,1_Z0",
      "toPort": 0
    },
    {
      "fromCell": "1,0_Z0",
      "fromPort": 4,
      "toCell": "1,0_Z1",
      "toPort": 5
    },
    {
      "fromCell": "2,0_Z0",
      "fromPort": 2,
      "toCell": "2,1_Z0",
      "toPort": 0
    },
    {
      "fromCell": "2,0_Z0",
      "fromPort": 4,
      "toCell": "2,0_Z1",
      "toPort": 5
    },
    {
      "fromCell": "0,1_Z0",
      "fromPort": 1,
      "toCell": "1,1_Z0",
      "toPort": 3
    },
    {
      "fromCell": "0,1_Z0",
      "fromPort": 2,
      "toCell": "0,2_Z0",
      "toPort": 0
    },
    {
      "fromCell": "0,1_Z0",
      "fromPort": 4,
      "toCell": "0,1_Z1",
      "toPort": 5
    },
    {
      "fromCell": "1,1_Z0",
      "fromPort": 1,
      "toCell": "2,1_Z0",
      "toPort": 3
    },
    {
      "fromCell": "1,1_Z0",
      "fromPort": 2,
      "toCell": "1,2_Z0",
      "toPort": 0
    },
    {
      "fromCell": "1,1_Z0",
      "fromPort": 4,
      "toCell": "1,1_Z1",
      "toPort": 5
    },
    {
      "fromCell": "2,1_Z0",
      "fromPort": 2,
      "toCell": "2,2_Z0",
      "toPort": 0
    },
    {
      "fromCell": "2,1_Z0",
      "fromPort": 4,
      "toCell": "2,1_Z1",
      "toPort": 5
    },
    {
      "fromCell": "0,2_Z0",
      "fromPort": 1,
      "toCell": "1,2_Z0",
      "toPort": 3
    },
    {
      "fromCell": "0,2_Z0",
      "fromPort": 4,
      "toCell": "0,2_Z1",
      "toPort": 5
    },
    {
      "fromCell": "1,2_Z0",
      "fromPort": 1,
      "toCell": "2,2_Z0",
      "toPort": 3
    },
    {
      "fromCell": "1,2_Z0",
      "fromPort": 4,
      "toCell": "1,2_Z1",
      "toPort": 5
    },
    {
      "fromCell": "2,2_Z0",
      "fromPort": 4,
      "toCell": "2,2_Z1",
      "toPort": 5
    },
    {
      "fromCell": "0,0_Z1",
      "fromPort": 1,
      "toCell": "1,0_Z1",
      "toPort": 3
    },
    {
      "fromCell": "0,0_Z1",
      "fromPort": 2,
      "toCell": "0,1_Z1",
      "toPort": 0
    },
    {
      "fromCell": "0,0_Z1",
      "fromPort": 4,
      "toCell": "0,0_Z2",
      "toPort": 5
    },
    {
      "fromCell": "1,0_Z1",
      "fromPort": 1,
      "toCell": "2,0_Z1",
      "toPort": 3
    },
    {
      "fromCell": "1,0_Z1",
      "fromPort": 2,
      "toCell": "1,1_Z1",
      "toPort": 0
    },
    {
      "fromCell": "1,0_Z1",
      "fromPort": 4,
      "toCell": "1,0_Z2",
      "toPort": 5
    },
    {
      "fromCell": "2,0_Z1",
      "fromPort": 2,
      "toCell": "2,1_Z1",
      "toPort": 0
    },
    {
      "fromCell": "2,0_Z1",
      "fromPort": 4,
      "toCell": "2,0_Z2",
      "toPort": 5
    },
    {
      "fromCell": "0,1_Z1",
      "fromPort": 1,
      "toCell": "1,1_Z1",
      "toPort": 3
    },
    {
      "fromCell": "0,1_Z1",
      "fromPort": 2,
      "toCell": "0,2_Z1",
      "toPort": 0
    },
    {
      "fromCell": "0,1_Z1",
      "fromPort": 4,
      "toCell": "0,1_Z2",
      "toPort": 5
    },
    {
      "fromCell": "1,1_Z1",
      "fromPort": 1,
      "toCell": "2,1_Z1",
      "toPort": 3
    },
    {
      "fromCell": "1,1_Z1",
      "fromPort": 2,
      "toCell": "1,2_Z1",
      "toPort": 0
    },
    {
      "fromCell": "1,1_Z1",
      "fromPort": 4,
      "toCell": "1,1_Z2",
      "toPort": 5
    },
    {
      "fromCell": "2,1_Z1",
      "fromPort": 2,
      "toCell": "2,2_Z1",
      "toPort": 0
    },
    {
      "fromCell": "2,1_Z1",
      "fromPort": 4,
      "toCell": "2,1_Z2",
      "toPort": 5
    },
    {
      "fromCell": "0,2_Z1",
      "fromPort": 1,
      "toCell": "1,2_Z1",
      "toPort": 3
    },
    {
      "fromCell": "0,2_Z1",
      "fromPort": 4,
      "toCell": "0,2_Z2",
      "toPort": 5
    },
    {
      "fromCell": "1,2_Z1",
      "fromPort": 1,
      "toCell": "2,2_Z1",
      "toPort": 3
    },
    {
      "fromCell": "1,2_Z1",
      "fromPort": 4,
      "toCell": "1,2_Z2",
      "toPort": 5
    },
    {
      "fromCell": "2,2_Z1",
      "fromPort": 4,
      "toCell": "2,2_Z2",
      "toPort": 5
    },
    {
      "fromCell": "0,0_Z2",
      "fromPort": 1,
      "toCell": "1,0_Z2",
      "toPort": 3
    },
    {
      "fromCell": "0,0_Z2",
      "fromPort": 2,
      "toCell": "0,1_Z2",
      "toPort": 0
    },
    {
      "fromCell": "1,0_Z2",
      "fromPort": 1,
      "toCell": "2,0_Z2",
      "toPort": 3
    },
    {
      "fromCell": "1,0_Z2",
      "fromPort": 2,
      "toCell": "1,1_Z2",
      "toPort": 0
    },
    {
      "fromCell": "2,0_Z2",
      "fromPort": 2,
      "toCell": "2,1_Z2",
      "toPort": 0
    },
    {
      "fromCell": "0,1_Z2",
      "fromPort": 1,
      "toCell": "1,1_Z2",
      "toPort": 3
    },
    {
      "fromCell": "0,1_Z2",
      "fromPort": 2,
      "toCell": "0,2_Z2",
      "toPort": 0
    },
    {
      "fromCell": "1,1_Z2",
      "fromPort": 1,
      "toCell": "2,1_Z2",
      "toPort": 3
    },
    {
      "fromCell": "1,1_Z2",
      "fromPort": 2,
      "toCell": "1,2_Z2",
      "toPort": 0
    },
    {
      "fromCell": "2,1_Z2",
      "fromPort": 2,
      "toCell": "2,2_Z2",
      "toPort": 0
    },
    {
      "fromCell": "0,2_Z2",
      "fromPort": 1,
      "toCell": "1,2_Z2",
      "toPort": 3
    },
    {
      "fromCell": "1,2_Z2",
      "fromPort": 1,
      "toCell": "2,2_Z2",
      "toPort": 3
    }
  ],
  "arrows": [
    {
      "id": "blue",
      "color": "#3b82f6",
      "head": {
        "cellId": "0,0_Z0",
        "exitPort": 4
      },
      "body": [
        "1,0_Z0"
      ]
    },
    {
      "id": "green",
      "color": "#22c55e",
      "head": {
        "cellId": "0,1_Z2",
        "exitPort": 2
      },
      "body": [
        "0,0_Z2",
        "0,0_Z1"
      ]
    },
    {
      "id": "orange",
      "color": "#f97316",
      "head": {
        "cellId": "1,2_Z2",
        "exitPort": 1
      },
      "body": [
        "0,2_Z2",
        "0,2_Z1"
      ]
    },
    {
      "id": "magenta",
      "color": "#ec4899",
      "head": {
        "cellId": "2,2_Z1",
        "exitPort": 5
      },
      "body": [
        "2,2_Z2",
        "2,1_Z2"
      ]
    },
    {
      "id": "violet",
      "color": "#8b5cf6",
      "head": {
        "cellId": "2,1_Z0",
        "exitPort": 0
      },
      "body": [
        "2,2_Z0",
        "1,2_Z0"
      ]
    },
    {
      "id": "cyan",
      "color": "#06b6d4",
      "head": {
        "cellId": "1,0_Z1",
        "exitPort": 4
      },
      "body": [
        "2,0_Z1",
        "2,0_Z0"
      ]
    },
    {
      "id": "amber",
      "color": "#f59e0b",
      "head": {
        "cellId": "1,1_Z2",
        "exitPort": 5
      },
      "body": [
        "1,0_Z2",
        "2,0_Z2"
      ]
    },
    {
      "id": "rose",
      "color": "#fb7185",
      "head": {
        "cellId": "1,1_Z1",
        "exitPort": 3
      },
      "body": [
        "1,1_Z0",
        "0,1_Z0"
      ]
    }
  ]
};
