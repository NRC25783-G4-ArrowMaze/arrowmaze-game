Feature: Construcción y Deserialización del Tablero desde Archivo JSON
  Como motor del juego (Capa de Aplicación / Casos de Uso)
  Quiero utilizar el puerto IBoardBuilder para parsear un objeto LevelData
  Para instanciar el Board, registrar sus celdas y restaurar la topología del grafo en memoria

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  # LevelData    : DTO validado con metadata (name, difficulty, allowedMoves) y topología.
  # IBoardBuilder: Interfaz de aplicación que transforma el DTO en entidades del dominio.
  # Cell         : Nodo con N puertos (N par y > 0). Expone getConnection() al frontend.
  # Connection   : Unión bidireccional entre (fromCell, fromPort) y (toCell, toPort).
  # ─────────────────────────────────────────────

  Background: estructura base esperada del LevelData
    Given que el sistema espera que el JSON crudo se parsee en un objeto `LevelData` con la forma:
      """json
      {
        "id": "level_01",
        "name": "Nivel Inicial",
        "difficulty": "easy",
        "allowedMoves": 25,
        "cells": [
          { "id": "C1", "portCount": 4 },
          { "id": "C2", "portCount": 4 }
        ],
        "connections": [
          { "fromCell": "C1", "fromPort": 1, "toCell": "C2", "toPort": 3 }
        ]
      }
      """
    And el `IBoardBuilder` orquesta la instanciación garantizando que los datos cumplan el contrato

  # ══════════════════════════════════════════════
  # BLOQUE 1 — VALIDACIÓN DE LA ESTRUCTURA DE CELDAS
  # ══════════════════════════════════════════════

  Scenario: construcción exitosa de un tablero con celdas desconectadas
    Given un DTO `LevelData` válido con el ID "board_test"
    And contiene las celdas [{ "id": "A", "portCount": 4 }, { "id": "B", "portCount": 4 }]
    And la lista de conexiones está vacía
    When el `IBoardBuilder` ejecuta el método `build(data)`
    Then el sistema retorna una instancia válida de `Board` con ID "board_test"
    And `board.getAllCells()` devuelve exactamente 2 instancias de `Cell`
    And todas las celdas tienen todos sus puertos configurados como salidas (isExit = true)

  Scenario: rechazo por cantidad de puertos impar en el JSON
    Given un DTO `LevelData` que declara una celda con "portCount": 3
    When el `IBoardBuilder` intenta instanciar dicha celda
    Then el sistema lanza el error "TopologyError: port count must be an even number"

  Scenario: rechazo por cantidad de puertos inválida (cero o negativo)
    Given un DTO `LevelData` que declara una celda con "portCount": 0
    When el `IBoardBuilder` intenta instanciar dicha celda
    Then el sistema lanza el error "TopologyError: port count must be a positive integer"

  Scenario: rechazo por IDs de celda duplicados en el JSON
    Given un DTO `LevelData` que declara dos celdas con el mismo "id": "cell_dup"
    When el `IBoardBuilder` intenta registrar la segunda celda
    Then el sistema lanza el error "BoardRegistryError: cell ID already exists in this board"

  # ══════════════════════════════════════════════
  # BLOQUE 2 — RECONSTRUCCIÓN DE LA TOPOLOGÍA (CONEXIONES)
  # ══════════════════════════════════════════════

  Scenario: mapeo exitoso de una conexión bidireccional
    Given un DTO `LevelData` con las celdas "C1" y "C2" (ambas con 4 puertos)
    And una conexión declarada: { "fromCell": "C1", "fromPort": 1, "toCell": "C2", "toPort": 3 }
    When el `IBoardBuilder` procesa las conexiones invocando `board.connectPorts()`
    Then `C1.getNeighborAtPort(1)` devuelve la referencia a `C2`
    And `C2.getNeighborAtPort(3)` devuelve la referencia a `C1`

  Scenario: rechazo de conexión por referencia a una celda inexistente
    Given un DTO `LevelData` con una conexión declarada hacia una celda fantasma: 
      """
      { "fromCell": "C1", "fromPort": 0, "toCell": "C_GHOST", "toPort": 2 }
      """
    When el `IBoardBuilder` intenta resolver las referencias de las celdas
    Then el sistema lanza el error "BoardRegistryError: referenced cell \"C_GHOST\" not found in registry"

  Scenario: rechazo por intento de auto-conexión en el JSON
    Given un DTO `LevelData` con la conexión: { "fromCell": "C1", "fromPort": 0, "toCell": "C1", "toPort": 2 }
    When el `IBoardBuilder` invoca `board.connectPorts()`
    Then el sistema lanza el error "ConnectionError: a cell cannot connect to itself"

  Scenario: rechazo por intento de conexión a un puerto fuera de rango
    Given un DTO `LevelData` con la celda "C1" de "portCount": 4
    And una conexión declarada: { "fromCell": "C1", "fromPort": 5, "toCell": "C2", "toPort": 0 }
    When el `IBoardBuilder` invoca `board.connectPorts()`
    Then el sistema lanza el error "TopologyError: port index out of range [0, 3]"

  Scenario: rechazo por colisión de conexiones (puerto ya ocupado)
    Given un DTO `LevelData` que declara las siguientes conexiones sucesivas:
      | fromCell | fromPort | toCell | toPort |
      | C1       | 1        | C2     | 3      |
      | C1       | 1        | C3     | 3      |
    When el `IBoardBuilder` procesa la segunda conexión
    Then la celda `C1` lanza el error "ConnectionError: port 1 of cell C1 is already occupied"

  # ══════════════════════════════════════════════
  # BLOQUE 3 — INVARIANTES POST-CONSTRUCCIÓN
  # ══════════════════════════════════════════════

  Scenario: el tablero construido no expone mutabilidad de sus IDs
    Given un tablero exitosamente construido a partir de un `LevelData`
    When intento reasignar el ID de una celda `(cell as any).id = "HACKED"`
    Then el motor de JavaScript lanza un TypeError en modo estricto
    And `cell.getId()` sigue devolviendo el ID original

  # ══════════════════════════════════════════════
  # BLOQUE 4 — VALIDACIÓN DEL DTO LevelData
  # ══════════════════════════════════════════════

  Scenario: rechazo por tablero sin ID
    Given un DTO LevelData sin la propiedad "id"
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "LevelDataError: missing required field 'id'"

  Scenario: rechazo por DTO sin array de celdas
    Given un DTO LevelData sin la propiedad "cells"
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "LevelDataError: missing required field 'cells'"

  Scenario: rechazo por DTO sin allowedMoves
    Given un DTO LevelData sin la propiedad "allowedMoves"
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "LevelDataError: missing required field 'allowedMoves'"

  Scenario: rechazo por allowedMoves no entero
    Given un DTO LevelData con "allowedMoves": "diez"
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "LevelDataError: allowedMoves must be a positive integer"

  Scenario: rechazo por tipos inválidos en portCount
    Given un DTO LevelData con una celda con "portCount": "cuatro"
    When el IBoardBuilder intenta instanciar dicha celda
    Then el sistema lanza el error "LevelDataError: portCount must be a number"

  Scenario: rechazo de tablero sin celdas
    Given un DTO LevelData con "cells": [] y "connections": []
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "LevelDataError: board must contain at least one cell"

  # ══════════════════════════════════════════════
  # BLOQUE 5 — INVARIANTES DE ITERACIÓN
  # ══════════════════════════════════════════════

  Scenario: orden determinista de getAllCells
    Given un DTO LevelData con celdas declaradas en orden ["C3", "C1", "C2"]
    When el IBoardBuilder construye el tablero
    And se invoca board.getAllCells()
    Then las celdas devueltas mantienen el orden ["C3", "C1", "C2"]

  # ══════════════════════════════════════════════
  # BLOQUE 6 — API DE CONEXIÓN PÚBLICA
  # ══════════════════════════════════════════════

  Scenario: la celda expone el puerto recíproco de la conexión
    Given un tablero con conexión C1.port1 ↔ C2.port3
    When el frontend invoca C1.getConnection(1)
    Then el resultado es { neighbor: C2, neighborPort: 3 }
    And C2.getConnection(3) devuelve { neighbor: C1, neighborPort: 1 }

  Scenario: un puerto sin conexión devuelve null
    Given una celda C1 con puerto 2 sin conexión
    When el frontend invoca C1.getConnection(2)
    Then el resultado es null
    And C1.isExit(2) devuelve true

  # ══════════════════════════════════════════════
  # BLOQUE 7 — RESTRICCIÓN DE PUERTOS OPUESTOS
  # ══════════════════════════════════════════════

  Scenario: rechazo por conexión entre puertos no opuestos
    Given un DTO LevelData con celdas "C1" y "C2" (portCount: 4)
    And una conexión declarada: { "fromCell": "C1", "fromPort": 0, "toCell": "C2", "toPort": 1 }
    When el IBoardBuilder ejecuta build(data)
    Then el sistema lanza el error "ConnectionError: ports must be opposite (expected 2, got 1)"
    And la construcción del tablero se aborta

  Scenario: aceptación de conexión entre puertos opuestos
    Given un DTO LevelData con celdas "C1" y "C2" (portCount: 4)
    And una conexión declarada: { "fromCell": "C1", "fromPort": 1, "toCell": "C2", "toPort": 3 }
    When el IBoardBuilder ejecuta build(data)
    Then la construcción del tablero finaliza sin errores
    And C1.getConnection(1) devuelve { neighbor: C2, neighborPort: 3 }