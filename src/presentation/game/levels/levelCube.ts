import type { LevelDataDTO } from '../../../application/dtos/LevelDataDTOs';

export const LEVEL_CUBE: LevelDataDTO = {
  "id": "cube",
  "name": "Cube",
  "difficulty": "hard",
  "allowedMoves": 12,
  "mapMode": "volume",
  "collisionBehavior": "return",
  "cells": [
    {
      "id": "0,0_Z0",
      "portCount": 6
    },
    {
      "id": "1,0_Z0",
      "portCount": 6
    },
    {
      "id": "2,0_Z0",
      "portCount": 6
    },
    {
      "id": "0,1_Z0",
      "portCount": 6
    },
    {
      "id": "1,1_Z0",
      "portCount": 6
    },
    {
      "id": "2,1_Z0",
      "portCount": 6
    },
    {
      "id": "0,2_Z0",
      "portCount": 6
    },
    {
      "id": "1,2_Z0",
      "portCount": 6
    },
    {
      "id": "2,2_Z0",
      "portCount": 6
    },
    {
      "id": "0,0_Z1",
      "portCount": 6
    },
    {
      "id": "1,0_Z1",
      "portCount": 6
    },
    {
      "id": "2,0_Z1",
      "portCount": 6
    },
    {
      "id": "0,1_Z1",
      "portCount": 6
    },
    {
      "id": "1,1_Z1",
      "portCount": 6
    },
    {
      "id": "2,1_Z1",
      "portCount": 6
    },
    {
      "id": "0,2_Z1",
      "portCount": 6
    },
    {
      "id": "1,2_Z1",
      "portCount": 6
    },
    {
      "id": "2,2_Z1",
      "portCount": 6
    },
    {
      "id": "0,0_Z2",
      "portCount": 6
    },
    {
      "id": "1,0_Z2",
      "portCount": 6
    },
    {
      "id": "2,0_Z2",
      "portCount": 6
    },
    {
      "id": "0,1_Z2",
      "portCount": 6
    },
    {
      "id": "1,1_Z2",
      "portCount": 6
    },
    {
      "id": "2,1_Z2",
      "portCount": 6
    },
    {
      "id": "0,2_Z2",
      "portCount": 6
    },
    {
      "id": "1,2_Z2",
      "portCount": 6
    },
    {
      "id": "2,2_Z2",
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
      "id": "magenta",
      "head": {
        "cellId": "1,0_Z0",
        "exitPort": 3
      },
      "body": [
        "0,0_Z0",
        "0,0_Z1"
      ]
    },
    {
      "id": "amber",
      "head": {
        "cellId": "0,1_Z2",
        "exitPort": 0
      },
      "body": [
        "0,0_Z2",
        "1,0_Z2"
      ]
    },
    {
      "id": "orange",
      "head": {
        "cellId": "2,0_Z1",
        "exitPort": 4
      },
      "body": [
        "2,0_Z2",
        "2,1_Z2"
      ]
    },
    {
      "id": "violet",
      "head": {
        "cellId": "2,2_Z0",
        "exitPort": 3
      },
      "body": [
        "1,2_Z0",
        "1,1_Z0"
      ]
    },
    {
      "id": "green",
      "head": {
        "cellId": "2,0_Z0",
        "exitPort": 2
      },
      "body": [
        "2,1_Z0",
        "2,1_Z1"
      ]
    },
    {
      "id": "cyan",
      "head": {
        "cellId": "0,2_Z1",
        "exitPort": 0
      },
      "body": [
        "0,1_Z1",
        "1,1_Z1"
      ]
    },
    {
      "id": "blue",
      "head": {
        "cellId": "1,2_Z1",
        "exitPort": 1
      },
      "body": [
        "2,2_Z1",
        "2,2_Z2"
      ]
    },
    {
      "id": "rose",
      "head": {
        "cellId": "0,2_Z2",
        "exitPort": 1
      },
      "body": [
        "1,2_Z2"
      ]
    }
  ]
};
