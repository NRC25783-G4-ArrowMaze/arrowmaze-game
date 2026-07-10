import type { LevelDataDTO } from '../scene';

/**
 * level-heart — "Corazón" (último nivel).
 *
 * Mapa-grafo con forma de corazón (75 celdas, 13 flechas) diseñado en el editor
 * FORGE por el autor y exportado como LevelDataDTO. Cada flecha es una serpiente
 * que apunta hacia afuera del contorno; el nivel se resuelve pelando el corazón
 * desde las flechas que ya pueden escapar (ver localLevels.spec para el orden).
 */
export const LEVEL_HEART: LevelDataDTO = {
  "id": "heart-preview",
  "name": "Corazón",
  "difficulty": "easy",
  "allowedMoves": 20,
  "cells": [
    {
      "id": "2,1",
      "portCount": 4
    },
    {
      "id": "3,1",
      "portCount": 4
    },
    {
      "id": "4,1",
      "portCount": 4
    },
    {
      "id": "4,2",
      "portCount": 4
    },
    {
      "id": "5,2",
      "portCount": 4
    },
    {
      "id": "1,2",
      "portCount": 4
    },
    {
      "id": "2,2",
      "portCount": 4
    },
    {
      "id": "3,2",
      "portCount": 4
    },
    {
      "id": "3,3",
      "portCount": 4
    },
    {
      "id": "3,4",
      "portCount": 4
    },
    {
      "id": "2,4",
      "portCount": 4
    },
    {
      "id": "2,3",
      "portCount": 4
    },
    {
      "id": "1,3",
      "portCount": 4
    },
    {
      "id": "1,4",
      "portCount": 4
    },
    {
      "id": "1,5",
      "portCount": 4
    },
    {
      "id": "2,5",
      "portCount": 4
    },
    {
      "id": "2,6",
      "portCount": 4
    },
    {
      "id": "3,6",
      "portCount": 4
    },
    {
      "id": "3,7",
      "portCount": 4
    },
    {
      "id": "4,7",
      "portCount": 4
    },
    {
      "id": "4,8",
      "portCount": 4
    },
    {
      "id": "5,7",
      "portCount": 4
    },
    {
      "id": "5,8",
      "portCount": 4
    },
    {
      "id": "5,9",
      "portCount": 4
    },
    {
      "id": "6,9",
      "portCount": 4
    },
    {
      "id": "6,10",
      "portCount": 4
    },
    {
      "id": "7,9",
      "portCount": 4
    },
    {
      "id": "7,8",
      "portCount": 4
    },
    {
      "id": "7,7",
      "portCount": 4
    },
    {
      "id": "6,7",
      "portCount": 4
    },
    {
      "id": "6,8",
      "portCount": 4
    },
    {
      "id": "8,8",
      "portCount": 4
    },
    {
      "id": "8,7",
      "portCount": 4
    },
    {
      "id": "9,7",
      "portCount": 4
    },
    {
      "id": "3,5",
      "portCount": 4
    },
    {
      "id": "4,5",
      "portCount": 4
    },
    {
      "id": "4,6",
      "portCount": 4
    },
    {
      "id": "5,6",
      "portCount": 4
    },
    {
      "id": "5,5",
      "portCount": 4
    },
    {
      "id": "4,4",
      "portCount": 4
    },
    {
      "id": "4,3",
      "portCount": 4
    },
    {
      "id": "5,3",
      "portCount": 4
    },
    {
      "id": "5,4",
      "portCount": 4
    },
    {
      "id": "6,6",
      "portCount": 4
    },
    {
      "id": "6,4",
      "portCount": 4
    },
    {
      "id": "6,5",
      "portCount": 4
    },
    {
      "id": "7,6",
      "portCount": 4
    },
    {
      "id": "8,6",
      "portCount": 4
    },
    {
      "id": "9,6",
      "portCount": 4
    },
    {
      "id": "10,6",
      "portCount": 4
    },
    {
      "id": "11,5",
      "portCount": 4
    },
    {
      "id": "11,4",
      "portCount": 4
    },
    {
      "id": "11,3",
      "portCount": 4
    },
    {
      "id": "11,2",
      "portCount": 4
    },
    {
      "id": "10,2",
      "portCount": 4
    },
    {
      "id": "9,2",
      "portCount": 4
    },
    {
      "id": "8,2",
      "portCount": 4
    },
    {
      "id": "7,2",
      "portCount": 4
    },
    {
      "id": "6,3",
      "portCount": 4
    },
    {
      "id": "7,3",
      "portCount": 4
    },
    {
      "id": "7,4",
      "portCount": 4
    },
    {
      "id": "7,5",
      "portCount": 4
    },
    {
      "id": "8,5",
      "portCount": 4
    },
    {
      "id": "8,4",
      "portCount": 4
    },
    {
      "id": "8,3",
      "portCount": 4
    },
    {
      "id": "9,3",
      "portCount": 4
    },
    {
      "id": "9,4",
      "portCount": 4
    },
    {
      "id": "9,5",
      "portCount": 4
    },
    {
      "id": "10,5",
      "portCount": 4
    },
    {
      "id": "10,4",
      "portCount": 4
    },
    {
      "id": "10,3",
      "portCount": 4
    },
    {
      "id": "8,1",
      "portCount": 4
    },
    {
      "id": "9,1",
      "portCount": 4
    },
    {
      "id": "10,1",
      "portCount": 4
    }
  ],
  "connections": [
    {
      "fromCell": "2,1",
      "fromPort": 1,
      "toCell": "3,1",
      "toPort": 3
    },
    {
      "fromCell": "3,1",
      "fromPort": 1,
      "toCell": "4,1",
      "toPort": 3
    },
    {
      "fromCell": "4,1",
      "fromPort": 2,
      "toCell": "4,2",
      "toPort": 0
    },
    {
      "fromCell": "4,2",
      "fromPort": 1,
      "toCell": "5,2",
      "toPort": 3
    },
    {
      "fromCell": "4,2",
      "fromPort": 3,
      "toCell": "3,2",
      "toPort": 1
    },
    {
      "fromCell": "3,1",
      "fromPort": 2,
      "toCell": "3,2",
      "toPort": 0
    },
    {
      "fromCell": "2,1",
      "fromPort": 2,
      "toCell": "2,2",
      "toPort": 0
    },
    {
      "fromCell": "2,2",
      "fromPort": 1,
      "toCell": "3,2",
      "toPort": 3
    },
    {
      "fromCell": "1,2",
      "fromPort": 1,
      "toCell": "2,2",
      "toPort": 3
    },
    {
      "fromCell": "3,2",
      "fromPort": 2,
      "toCell": "3,3",
      "toPort": 0
    },
    {
      "fromCell": "3,3",
      "fromPort": 2,
      "toCell": "3,4",
      "toPort": 0
    },
    {
      "fromCell": "3,4",
      "fromPort": 3,
      "toCell": "2,4",
      "toPort": 1
    },
    {
      "fromCell": "2,2",
      "fromPort": 2,
      "toCell": "2,3",
      "toPort": 0
    },
    {
      "fromCell": "1,2",
      "fromPort": 2,
      "toCell": "1,3",
      "toPort": 0
    },
    {
      "fromCell": "1,3",
      "fromPort": 1,
      "toCell": "2,3",
      "toPort": 3
    },
    {
      "fromCell": "1,3",
      "fromPort": 2,
      "toCell": "1,4",
      "toPort": 0
    },
    {
      "fromCell": "1,4",
      "fromPort": 2,
      "toCell": "1,5",
      "toPort": 0
    },
    {
      "fromCell": "1,5",
      "fromPort": 1,
      "toCell": "2,5",
      "toPort": 3
    },
    {
      "fromCell": "1,4",
      "fromPort": 1,
      "toCell": "2,4",
      "toPort": 3
    },
    {
      "fromCell": "2,3",
      "fromPort": 2,
      "toCell": "2,4",
      "toPort": 0
    },
    {
      "fromCell": "2,4",
      "fromPort": 2,
      "toCell": "2,5",
      "toPort": 0
    },
    {
      "fromCell": "2,5",
      "fromPort": 2,
      "toCell": "2,6",
      "toPort": 0
    },
    {
      "fromCell": "2,6",
      "fromPort": 1,
      "toCell": "3,6",
      "toPort": 3
    },
    {
      "fromCell": "2,5",
      "fromPort": 1,
      "toCell": "3,5",
      "toPort": 3
    },
    {
      "fromCell": "3,6",
      "fromPort": 0,
      "toCell": "3,5",
      "toPort": 2
    },
    {
      "fromCell": "3,4",
      "fromPort": 2,
      "toCell": "3,5",
      "toPort": 0
    },
    {
      "fromCell": "3,7",
      "fromPort": 0,
      "toCell": "3,6",
      "toPort": 2
    },
    {
      "fromCell": "3,7",
      "fromPort": 1,
      "toCell": "4,7",
      "toPort": 3
    },
    {
      "fromCell": "4,7",
      "fromPort": 2,
      "toCell": "4,8",
      "toPort": 0
    },
    {
      "fromCell": "4,8",
      "fromPort": 1,
      "toCell": "5,8",
      "toPort": 3
    },
    {
      "fromCell": "5,8",
      "fromPort": 2,
      "toCell": "5,9",
      "toPort": 0
    },
    {
      "fromCell": "5,9",
      "fromPort": 1,
      "toCell": "6,9",
      "toPort": 3
    },
    {
      "fromCell": "6,10",
      "fromPort": 0,
      "toCell": "6,9",
      "toPort": 2
    },
    {
      "fromCell": "6,9",
      "fromPort": 1,
      "toCell": "7,9",
      "toPort": 3
    },
    {
      "fromCell": "7,9",
      "fromPort": 0,
      "toCell": "7,8",
      "toPort": 2
    },
    {
      "fromCell": "6,8",
      "fromPort": 2,
      "toCell": "6,9",
      "toPort": 0
    },
    {
      "fromCell": "8,8",
      "fromPort": 3,
      "toCell": "7,8",
      "toPort": 1
    },
    {
      "fromCell": "7,8",
      "fromPort": 3,
      "toCell": "6,8",
      "toPort": 1
    },
    {
      "fromCell": "6,8",
      "fromPort": 3,
      "toCell": "5,8",
      "toPort": 1
    },
    {
      "fromCell": "5,8",
      "fromPort": 0,
      "toCell": "5,7",
      "toPort": 2
    },
    {
      "fromCell": "4,7",
      "fromPort": 1,
      "toCell": "5,7",
      "toPort": 3
    },
    {
      "fromCell": "5,7",
      "fromPort": 1,
      "toCell": "6,7",
      "toPort": 3
    },
    {
      "fromCell": "6,7",
      "fromPort": 2,
      "toCell": "6,8",
      "toPort": 0
    },
    {
      "fromCell": "7,8",
      "fromPort": 0,
      "toCell": "7,7",
      "toPort": 2
    },
    {
      "fromCell": "6,7",
      "fromPort": 1,
      "toCell": "7,7",
      "toPort": 3
    },
    {
      "fromCell": "7,7",
      "fromPort": 1,
      "toCell": "8,7",
      "toPort": 3
    },
    {
      "fromCell": "8,7",
      "fromPort": 2,
      "toCell": "8,8",
      "toPort": 0
    },
    {
      "fromCell": "8,7",
      "fromPort": 1,
      "toCell": "9,7",
      "toPort": 3
    },
    {
      "fromCell": "9,7",
      "fromPort": 0,
      "toCell": "9,6",
      "toPort": 2
    },
    {
      "fromCell": "4,6",
      "fromPort": 2,
      "toCell": "4,7",
      "toPort": 0
    },
    {
      "fromCell": "3,6",
      "fromPort": 1,
      "toCell": "4,6",
      "toPort": 3
    },
    {
      "fromCell": "3,5",
      "fromPort": 1,
      "toCell": "4,5",
      "toPort": 3
    },
    {
      "fromCell": "4,5",
      "fromPort": 2,
      "toCell": "4,6",
      "toPort": 0
    },
    {
      "fromCell": "4,6",
      "fromPort": 1,
      "toCell": "5,6",
      "toPort": 3
    },
    {
      "fromCell": "5,6",
      "fromPort": 2,
      "toCell": "5,7",
      "toPort": 0
    },
    {
      "fromCell": "6,6",
      "fromPort": 2,
      "toCell": "6,7",
      "toPort": 0
    },
    {
      "fromCell": "7,6",
      "fromPort": 2,
      "toCell": "7,7",
      "toPort": 0
    },
    {
      "fromCell": "8,6",
      "fromPort": 2,
      "toCell": "8,7",
      "toPort": 0
    },
    {
      "fromCell": "10,6",
      "fromPort": 3,
      "toCell": "9,6",
      "toPort": 1
    },
    {
      "fromCell": "10,6",
      "fromPort": 0,
      "toCell": "10,5",
      "toPort": 2
    },
    {
      "fromCell": "11,5",
      "fromPort": 3,
      "toCell": "10,5",
      "toPort": 1
    },
    {
      "fromCell": "10,5",
      "fromPort": 0,
      "toCell": "10,4",
      "toPort": 2
    },
    {
      "fromCell": "5,6",
      "fromPort": 1,
      "toCell": "6,6",
      "toPort": 3
    },
    {
      "fromCell": "6,6",
      "fromPort": 1,
      "toCell": "7,6",
      "toPort": 3
    },
    {
      "fromCell": "8,6",
      "fromPort": 3,
      "toCell": "7,6",
      "toPort": 1
    },
    {
      "fromCell": "8,6",
      "fromPort": 1,
      "toCell": "9,6",
      "toPort": 3
    },
    {
      "fromCell": "9,6",
      "fromPort": 0,
      "toCell": "9,5",
      "toPort": 2
    },
    {
      "fromCell": "8,5",
      "fromPort": 2,
      "toCell": "8,6",
      "toPort": 0
    },
    {
      "fromCell": "7,5",
      "fromPort": 2,
      "toCell": "7,6",
      "toPort": 0
    },
    {
      "fromCell": "6,5",
      "fromPort": 2,
      "toCell": "6,6",
      "toPort": 0
    },
    {
      "fromCell": "4,5",
      "fromPort": 1,
      "toCell": "5,5",
      "toPort": 3
    },
    {
      "fromCell": "5,5",
      "fromPort": 2,
      "toCell": "5,6",
      "toPort": 0
    },
    {
      "fromCell": "4,5",
      "fromPort": 0,
      "toCell": "4,4",
      "toPort": 2
    },
    {
      "fromCell": "3,4",
      "fromPort": 1,
      "toCell": "4,4",
      "toPort": 3
    },
    {
      "fromCell": "2,3",
      "fromPort": 1,
      "toCell": "3,3",
      "toPort": 3
    },
    {
      "fromCell": "3,3",
      "fromPort": 1,
      "toCell": "4,3",
      "toPort": 3
    },
    {
      "fromCell": "4,2",
      "fromPort": 2,
      "toCell": "4,3",
      "toPort": 0
    },
    {
      "fromCell": "4,3",
      "fromPort": 2,
      "toCell": "4,4",
      "toPort": 0
    },
    {
      "fromCell": "4,4",
      "fromPort": 1,
      "toCell": "5,4",
      "toPort": 3
    },
    {
      "fromCell": "4,3",
      "fromPort": 1,
      "toCell": "5,3",
      "toPort": 3
    },
    {
      "fromCell": "5,5",
      "fromPort": 1,
      "toCell": "6,5",
      "toPort": 3
    },
    {
      "fromCell": "5,4",
      "fromPort": 2,
      "toCell": "5,5",
      "toPort": 0
    },
    {
      "fromCell": "5,3",
      "fromPort": 2,
      "toCell": "5,4",
      "toPort": 0
    },
    {
      "fromCell": "5,2",
      "fromPort": 2,
      "toCell": "5,3",
      "toPort": 0
    },
    {
      "fromCell": "5,3",
      "fromPort": 1,
      "toCell": "6,3",
      "toPort": 3
    },
    {
      "fromCell": "5,4",
      "fromPort": 1,
      "toCell": "6,4",
      "toPort": 3
    },
    {
      "fromCell": "6,4",
      "fromPort": 2,
      "toCell": "6,5",
      "toPort": 0
    },
    {
      "fromCell": "6,5",
      "fromPort": 1,
      "toCell": "7,5",
      "toPort": 3
    },
    {
      "fromCell": "7,5",
      "fromPort": 1,
      "toCell": "8,5",
      "toPort": 3
    },
    {
      "fromCell": "8,5",
      "fromPort": 1,
      "toCell": "9,5",
      "toPort": 3
    },
    {
      "fromCell": "9,5",
      "fromPort": 1,
      "toCell": "10,5",
      "toPort": 3
    },
    {
      "fromCell": "9,5",
      "fromPort": 0,
      "toCell": "9,4",
      "toPort": 2
    },
    {
      "fromCell": "8,5",
      "fromPort": 0,
      "toCell": "8,4",
      "toPort": 2
    },
    {
      "fromCell": "7,5",
      "fromPort": 0,
      "toCell": "7,4",
      "toPort": 2
    },
    {
      "fromCell": "7,4",
      "fromPort": 3,
      "toCell": "6,4",
      "toPort": 1
    },
    {
      "fromCell": "6,3",
      "fromPort": 2,
      "toCell": "6,4",
      "toPort": 0
    },
    {
      "fromCell": "7,2",
      "fromPort": 2,
      "toCell": "7,3",
      "toPort": 0
    },
    {
      "fromCell": "7,3",
      "fromPort": 3,
      "toCell": "6,3",
      "toPort": 1
    },
    {
      "fromCell": "7,3",
      "fromPort": 2,
      "toCell": "7,4",
      "toPort": 0
    },
    {
      "fromCell": "7,4",
      "fromPort": 1,
      "toCell": "8,4",
      "toPort": 3
    },
    {
      "fromCell": "7,3",
      "fromPort": 1,
      "toCell": "8,3",
      "toPort": 3
    },
    {
      "fromCell": "7,2",
      "fromPort": 1,
      "toCell": "8,2",
      "toPort": 3
    },
    {
      "fromCell": "8,2",
      "fromPort": 2,
      "toCell": "8,3",
      "toPort": 0
    },
    {
      "fromCell": "8,3",
      "fromPort": 1,
      "toCell": "9,3",
      "toPort": 3
    },
    {
      "fromCell": "8,3",
      "fromPort": 2,
      "toCell": "8,4",
      "toPort": 0
    },
    {
      "fromCell": "9,4",
      "fromPort": 3,
      "toCell": "8,4",
      "toPort": 1
    },
    {
      "fromCell": "9,3",
      "fromPort": 2,
      "toCell": "9,4",
      "toPort": 0
    },
    {
      "fromCell": "9,4",
      "fromPort": 1,
      "toCell": "10,4",
      "toPort": 3
    },
    {
      "fromCell": "10,4",
      "fromPort": 1,
      "toCell": "11,4",
      "toPort": 3
    },
    {
      "fromCell": "11,4",
      "fromPort": 2,
      "toCell": "11,5",
      "toPort": 0
    },
    {
      "fromCell": "11,3",
      "fromPort": 2,
      "toCell": "11,4",
      "toPort": 0
    },
    {
      "fromCell": "10,3",
      "fromPort": 2,
      "toCell": "10,4",
      "toPort": 0
    },
    {
      "fromCell": "9,3",
      "fromPort": 1,
      "toCell": "10,3",
      "toPort": 3
    },
    {
      "fromCell": "11,3",
      "fromPort": 3,
      "toCell": "10,3",
      "toPort": 1
    },
    {
      "fromCell": "10,3",
      "fromPort": 0,
      "toCell": "10,2",
      "toPort": 2
    },
    {
      "fromCell": "9,2",
      "fromPort": 2,
      "toCell": "9,3",
      "toPort": 0
    },
    {
      "fromCell": "8,2",
      "fromPort": 1,
      "toCell": "9,2",
      "toPort": 3
    },
    {
      "fromCell": "8,2",
      "fromPort": 0,
      "toCell": "8,1",
      "toPort": 2
    },
    {
      "fromCell": "8,1",
      "fromPort": 1,
      "toCell": "9,1",
      "toPort": 3
    },
    {
      "fromCell": "9,1",
      "fromPort": 2,
      "toCell": "9,2",
      "toPort": 0
    },
    {
      "fromCell": "9,1",
      "fromPort": 1,
      "toCell": "10,1",
      "toPort": 3
    },
    {
      "fromCell": "10,1",
      "fromPort": 2,
      "toCell": "10,2",
      "toPort": 0
    },
    {
      "fromCell": "9,2",
      "fromPort": 1,
      "toCell": "10,2",
      "toPort": 3
    },
    {
      "fromCell": "10,2",
      "fromPort": 1,
      "toCell": "11,2",
      "toPort": 3
    },
    {
      "fromCell": "11,2",
      "fromPort": 2,
      "toCell": "11,3",
      "toPort": 0
    }
  ],
  "arrows": [
    {
      "id": "arrow-1",
      "head": {
        "cellId": "5,2",
        "exitPort": 3
      },
      "body": [
        "4,2",
        "4,1",
        "3,1",
        "2,1"
      ]
    },
    {
      "id": "arrow-2",
      "head": {
        "cellId": "6,3",
        "exitPort": 3
      },
      "body": [
        "5,3",
        "4,3",
        "4,4",
        "5,4",
        "6,4"
      ]
    },
    {
      "id": "arrow-3",
      "head": {
        "cellId": "8,4",
        "exitPort": 3
      },
      "body": [
        "7,4",
        "7,3",
        "7,2",
        "8,2",
        "8,1",
        "9,1",
        "10,1"
      ]
    },
    {
      "id": "arrow-4",
      "head": {
        "cellId": "2,4",
        "exitPort": 1
      },
      "body": [
        "3,4",
        "3,3",
        "3,2",
        "2,2",
        "1,2"
      ]
    },
    {
      "id": "arrow-5",
      "head": {
        "cellId": "8,6",
        "exitPort": 3
      },
      "body": [
        "7,6",
        "6,6",
        "5,6",
        "4,6",
        "3,6",
        "2,6",
        "2,5",
        "1,5",
        "1,4",
        "1,3",
        "2,3"
      ]
    },
    {
      "id": "arrow-6",
      "head": {
        "cellId": "3,5",
        "exitPort": 1
      },
      "body": [
        "4,5",
        "5,5",
        "6,5",
        "7,5",
        "8,5"
      ]
    },
    {
      "id": "arrow-7",
      "head": {
        "cellId": "9,5",
        "exitPort": 2
      },
      "body": [
        "9,6",
        "10,6"
      ]
    },
    {
      "id": "arrow-8",
      "head": {
        "cellId": "5,7",
        "exitPort": 2
      },
      "body": [
        "5,8",
        "5,9",
        "6,9",
        "6,10"
      ]
    },
    {
      "id": "arrow-9",
      "head": {
        "cellId": "3,7",
        "exitPort": 1
      },
      "body": [
        "4,7",
        "4,8"
      ]
    },
    {
      "id": "arrow-10",
      "head": {
        "cellId": "6,8",
        "exitPort": 0
      },
      "body": [
        "6,7",
        "7,7",
        "7,8",
        "7,9"
      ]
    },
    {
      "id": "arrow-11",
      "head": {
        "cellId": "9,7",
        "exitPort": 3
      },
      "body": [
        "8,7",
        "8,8"
      ]
    },
    {
      "id": "arrow-12",
      "head": {
        "cellId": "11,2",
        "exitPort": 2
      },
      "body": [
        "11,3",
        "11,4",
        "11,5",
        "10,5",
        "10,4",
        "9,4",
        "9,3",
        "8,3"
      ]
    },
    {
      "id": "arrow-13",
      "head": {
        "cellId": "10,3",
        "exitPort": 0
      },
      "body": [
        "10,2",
        "9,2"
      ]
    }
  ]
};
