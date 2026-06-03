Feature: Colocación inicial de flechas en el tablero

  Como motor lógico del juego
  Quiero instanciar y colocar una flecha (entidad inteligente) sobre los nodos del grafo pasivo
  Para que la flecha establezca su estado topológico inicial y configure su dirección de salida antes de iniciar el movimiento

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE DEL DOMINIO (SRP APLICADO)
  # Graph / Cell : Contenedores pasivos. Solo saben quiénes son sus vecinos por puerto.
  # Arrow        : Entidad activa (lista enlazada). Calcula sus propios puertos al colocarse.
  # Head         : Segmento motor de la flecha. Único con intención de salida explícita (exitPort).
  #                prev = null siempre.
  # Segment      : Segmento de cuerpo. La flecha infiere sus puertos internos leyendo la adyacencia pasiva.
  #                next = null si es el último (cola).
  # fromPort     : Puerto de entrada al segmento (calculado internamente por la Flecha).
  # toPort       : Puerto de salida hacia el siguiente segmento (calculado internamente por la Flecha).
  # exitPort     : Puerto de avance futuro. Propiedad exclusiva de la Cabeza que define su dirección de salida.
  # ─────────────────────────────────────────────

  Background: Board como contenedor pasivo de P=4 puertos
    Given un board instanciado con celdas pasivas de 4 puertos
    And la regla topológica estricta: el puerto de entrada opuesto es (p + 2) mod 4
    And las siguientes celdas y conexiones estructurales:
      | celda | port 0 | port 1 | port 2 | port 3 |
      | C1    | exit   | C2     | exit   | exit   |
      | C2    | exit   | C3     | exit   | C1     |
      | C3    | exit   | C4     | exit   | C2     |
      | C4    | exit   | exit   | exit   | C3     |
      | C5    | exit   | exit   | exit   | exit   |

  # ══════════════════════════════════════════════
  # BLOQUE 1 — CREACIÓN E INVARIANTES DE LA ENTIDAD FLECHA
  # ══════════════════════════════════════════════

  Scenario: Creación de una flecha mínima (solo cabeza) estableciendo su intención de salida
    When la entidad Flecha se instancia en C1 definiendo su exitPort en 1
    Then la flecha existe en memoria de forma independiente
    And arrow.head ocupa pasivamente a C1
    And arrow.head.isHead es true
    And arrow.head.exitPort es 1
    And arrow.head.prev es null
    And arrow.head.next es null
    And arrow.length es 1

  Scenario: La cabeza dictamina el inicio de la lista (prev = null)
    Given una flecha que se ha colocado sobre [C1, C2, C3] con cabeza en C1
    Then el estado interno de arrow.head.prev es estrictamente null

  Scenario: El último segmento dictamina el fin de la lista (next = null)
    Given una flecha que se ha colocado sobre [C1, C2, C3] con cabeza en C1
    Then el estado interno del segmento en C3 dictamina que next es null

  Scenario: La entidad Flecha enlaza correctamente sus segmentos internos
    Given una flecha que se ha colocado sobre [C1, C2, C3] con cabeza en C1
    Then la Flecha enlaza el segmento en C2 con prev apuntando a C1
    And la Flecha enlaza el segmento en C2 con next apuntando a C3

  Scenario: La longitud interna de la Flecha refleja su ocupación en el grafo
    Given una flecha colocada abarcando las celdas [C1, C2, C3, C4]
    Then arrow.length reporta 4

  Scenario: La intención de salida de la cabeza (exitPort) puede apuntar al vacío (fuera del mapa)
    When la entidad Flecha se instancia en C1 definiendo su exitPort en 3
    Then arrow.head.exitPort es 3
    And el contenedor C1 reporta pacíficamente que su puerto 3 es isExit() == true


  # ══════════════════════════════════════════════
  # BLOQUE 2 — LÓGICA DE COLOCACIÓN Y AUTO-ENRUTAMIENTO (HAPPY PATH)
  # ══════════════════════════════════════════════

  Scenario: Colocación masiva de N segmentos en celdas conectadas
    When el motor ordena a la Flecha ocupar la secuencia [C1(head, exitPort:1), C2, C3, C4]
    Then la Flecha se auto-ensambla sobre [C1, C2, C3, C4]
    And las celdas pasivas [C1, C2, C3, C4] actualizan su estado a ocupadas (arrowSegment != null)
    And arrow.length es 4

  Scenario: Colocación incremental delegada a la entidad Flecha
    When instancio una Flecha con cabeza en C1 (exitPort 1)
    And le ordeno a la Flecha extender su cuerpo hacia C2
    And le ordeno a la Flecha extender su cuerpo hacia C3
    Then arrow.length es 3
    And la Flecha gestiona internamente que C1.next apunta a C2
    And la Flecha gestiona internamente que C2.next apunta a C3

  Scenario: La entidad Flecha notifica a la celda pasiva sobre su ocupación
    When la Flecha se coloca sobre C1 y se extiende a C2
    Then la celda C1 recibe y almacena la referencia del segmento (arrowSegment != null)
    And la celda C2 recibe y almacena la referencia del segmento (arrowSegment != null)
    And la celda C3 permanece vacía

  Scenario: La Flecha calcula lógicamente sus puertos internos en una trayectoria lineal
    Given la Flecha colocada sobre [C1(head, exitPort:1), C2, C3]
    When consulto el estado interno calculado por el segmento en C2
    Then la Flecha determinó que fromPort es 3  # Dedujo que entró desde C1
    And la Flecha determinó que toPort es 1     # Dedujo que sale hacia C3

  Scenario: La Flecha calcula lógicamente sus puertos internos en una curva
    Given un board donde el puerto 2 de C2 conecta al puerto 0 de C6
    And la Flecha colocada sobre [C1(head, exitPort:1), C2, C6]
    When consulto el estado interno calculado por el segmento en C2
    Then la Flecha determinó que fromPort es 3  # Entró recta desde C1
    And la Flecha determinó que toPort es 2     # Dobló hacia C6

  Scenario: La Flecha determina que su segmento de cola no tiene puerto de salida
    Given la Flecha colocada sobre [C1(head, exitPort:1), C2, C3]
    When consulto el estado interno calculado por la cola en C3
    Then la Flecha determinó que fromPort es 3
    And la Flecha asigna toPort como null


  # ══════════════════════════════════════════════
  # BLOQUE 3 — RESTRICCIONES DE COLOCACIÓN (LA FLECHA VALIDA LA TOPOLOGÍA)
  # ══════════════════════════════════════════════

  Scenario: La Flecha rechaza extenderse hacia una celda desconectada
    Given una Flecha con cabeza en C1 (exitPort 1)
    When la Flecha intenta extenderse hacia la celda C5 (desconectada de C1)
    Then la Flecha lanza el error "ArrowPlacementError: cell C5 is not physically connected to previous cell C1"

  Scenario: La Flecha rechaza colocarse sobre una celda ocupada por otra entidad
    Given una Flecha F1 ocupando pasivamente a C2
    And una Flecha F2 con cabeza en C1
    When F2 intenta extender su cuerpo hacia C2
    Then la Flecha lanza el error "ArrowPlacementError: cell C2 is already occupied by a different entity"

  Scenario: La Flecha rechaza la auto-colisión durante la colocación inicial
    Given una Flecha extendida sobre [C1, C2, C3, C4]
    When la Flecha intenta agregar un segmento adicional sobre su propia cabeza en C1
    Then la Flecha lanza el error "ArrowPlacementError: structural collision, cell C1 is occupied by self"

  Scenario: Obligatoriedad de colocar la cabeza primero (Motor de la entidad)
    When intento instanciar la Flecha arrojando un segmento de cuerpo genérico en C1
    Then el sistema lanza el error "ArrowPlacementError: initialization must start with a Head segment"

  Scenario: Obligatoriedad de definir la intención de salida (exitPort) al nacer
    When intento instanciar una Flecha en C1 sin proveer el exitPort
    Then el sistema lanza el error "ArrowCreationError: head segment requires an explicit exitPort intent"


  # ══════════════════════════════════════════════
  # BLOQUE 4 — INVARIANTES MATEMÁTICOS DE LA ENTIDAD
  # ══════════════════════════════════════════════

  Scenario: El exitPort es una propiedad exclusiva de la cabeza (Motor de dirección)
    Given una Flecha colocada sobre [C1(head, exitPort:1), C2, C3]
    Then el segmento en C1 (cabeza) reporta exitPort = 1
    And el segmento en C2 (cuerpo) reporta exitPort = null
    And el segmento en C3 (cola) reporta exitPort = null

  Scenario: La Flecha obedece la aritmética modular para calcular su fromPort
    Given una Flecha con cabeza en C1 y exitPort 1
    And la topología pasiva dicta que C1[port 1] conecta con C2[port 3]
    When la Flecha se extiende hacia C2
    Then la Flecha calcula matemáticamente su fromPort en C2 ejecutando (1 + 4/2) mod 4 = 3
    And el segmento en C2 almacena fromPort = 3

  Scenario: La cabeza carece de fromPort al no tener un segmento que la preceda
    When instancio una Flecha de longitud 1 en C1
    Then arrow.head.fromPort se define como null

  Scenario: Al ser removida, la Flecha limpia su rastro en los contenedores pasivos
    Given una Flecha colocada sobre [C1, C2, C3]
    When ordeno la destrucción de la Flecha
    Then la Flecha libera las referencias en las celdas
    And C1.arrowSegment vuelve a null
    And C2.arrowSegment vuelve a null
    And C3.arrowSegment vuelve a null