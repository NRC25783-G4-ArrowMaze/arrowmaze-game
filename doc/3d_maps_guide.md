# Guía de Creación y Edición de Mapas 3D en Arrow Maze

Esta guía está diseñada como un manual o diccionario para desarrolladores, diseñadores de niveles y agentes de IA. Explica cómo funciona el sistema de mapas 3D introducido recientemente, los cambios en los DTOs y cómo el motor maneja la tercera dimensión.

---

## 1. Concepto de Capas (Layers) y Z-Index

En Arrow Maze, la tercera dimensión se logra superponiendo tableros (capas Z) uno encima del otro.
El motor sigue operando bajo un **grafo de nodos** (celdas conectadas), por lo que la "altura" o la coordenada `Z` es en realidad una propiedad visual que se maneja a nivel de presentación y de estructura del nivel.

* **Capa 0:** Nivel base (suelo).
* **Capa 1:** Primer nivel elevado.
* **Capa N:** Enésimo nivel elevado.

> [!NOTE]
> Las flechas no "saben" que están en 3D. Ellas simplemente siguen las conexiones del grafo. Si el puerto `4` de la celda `A` conecta con el puerto `5` de la celda `B`, la flecha transitará normalmente.

---

## 2. Puertos Inter-Capa (Eje Z)

El salto clave para el 3D es extender los puertos de 4 a 6.

### Disposición de Puertos en Celdas 3D (`portCount: 6`)
| Puerto | Dirección | Símbolo Visual (Forge) | Uso Principal |
|--------|-----------|------------------------|---------------|
| `0` | Arriba (Y-) | - | Movimiento en plano XY |
| `1` | Derecha (X+) | - | Movimiento en plano XY |
| `2` | Abajo (Y+) | - | Movimiento en plano XY |
| `3` | Izquierda (X-) | - | Movimiento en plano XY |
| `4` | **Techo (Z+)** | **▲** | Conectar hacia una capa superior (`Z+1`) |
| `5` | **Piso (Z-)** | **▼** | Conectar hacia una capa inferior (`Z-1`) |

---

## 3. Estructura JSON / DTO del Nivel 3D

Para definir un nivel 3D, el JSON de `LevelDataDTO` requiere asignar explícitamente el campo `layer` a las celdas y definir su `portCount` en `6` (o el número máximo que aplique). Si una celda no declara `layer`, el motor asume `layer: 0`.

### Ejemplo Básico:
```json
{
  "id": "nivel-tutorial-3d",
  "allowedMoves": 10,
  "difficulty": 2,
  "collisionBehavior": "return",
  "cells": [
    { "id": "0,0", "col": 0, "row": 0, "portCount": 6, "layer": 0 },
    { "id": "0,1", "col": 0, "row": 1, "portCount": 6, "layer": 0 },
    
    { "id": "0,0_Z1", "col": 0, "row": 0, "portCount": 6, "layer": 1 }
  ],
  "connections": [
    { "fromCell": "0,0", "fromPort": 4, "toCell": "0,0_Z1", "toPort": 5 }
  ],
  "arrows": [
    {
      "id": "flecha-trepadora",
      "head": { "cellId": "0,1", "exitPort": 0 },
      "body": []
    }
  ]
}
```
* **Nomenclatura de IDs:** Como varias celdas pueden compartir el mismo `col` y `row` pero estar en distintas capas, se recomienda sufijar el `id` con la capa (ej. `"0,0_Z1"`).
* **collisionBehavior**: Propiedad introducida a nivel global (`return` o `stay`) que define si las flechas vuelven al origen o se quedan donde chocaron.

---

## 4. Visualización y Herramientas del Forge (Editor)

El editor `ForgeCanvas` ha sido actualizado drásticamente para permitir trabajar en 3D:

1. **Vista en Cascada (Isométrica):**
   * El editor ya no es completamente plano. Muestra la **Capa Activa**, la **Capa Z+1** y la **Capa Z-1** simultáneamente.
   * Las capas se dibujan con un desplazamiento o *offset* isométrico (50px diagonales por índice de capa).

2. **Identificación de Capas por Color:**
   * `Z=0` → Gris claro (#e8e8e8)
   * `Z=1` → Azul pastel (#e0f2fe)
   * `Z=2` → Verde pastel (#dcfce7)
   * `Z=3` → Amarillo pastel (#fef08a)
   * Las capas inactivas (las que no estás editando en ese momento) tendrán su opacidad reducida al **25%** (`0.25`) y bloquearán interacciones accidentales.

3. **Trazado de Conexiones en el Aire:**
   * Al seleccionar la herramienta *Connect*, los puertos de *todas* las capas visibles se vuelven seleccionables (opacidad al 100%).
   * Puedes hacer clic en el puerto `4` (▲) de la Capa 0 y luego en el puerto `5` (▼) de la Capa 1. El editor dibujará una línea punteada inter-capa violeta flotando en perspectiva isométrica, dándote total claridad visual del flujo.

---

## 5. Notas Importantes de Arquitectura

* **Dominio Intacto:** La lógica de dominio de `ArrowMaze` y `Arrow` sigue siendo 100% matemática y basada en grafos. Los puertos inter-capa solo son puertos adicionales para el dominio. La magia de la altura ocurre en la interpolación visual (`sceneFromLevelData.ts` y renders).
* **Round-trip Seguro:** Los metadatos 3D como `layer` y el modificador de comportamiento `collisionBehavior` sobreviven un viaje completo (importar JSON ➜ Editor ➜ exportar JSON).
* **Muestra 3D Rápida:** Para pruebas, puedes inyectar el mapa de prueba 3D en el Forge haciendo clic en el botón verde `"Cargar Muestra 3D"` ubicado en el panel `PublishPanel`.
