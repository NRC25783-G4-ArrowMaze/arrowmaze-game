Feature: Inicialización y representación del tablero como grafo de nodos en memoria

  Como motor del juego
  Quiero definir y manipular una estructura genérica de nodos con topología de puertos indexados
  Para generar un board/mapa pasivo sobre el cual las entidades (flechas) puedan navegar

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE DEL DOMINIO
  # Cell     : Contenedor pasivo del grafo definido por su cantidad de puertos (P). P debe ser par.
  # Puerto   : Índice numérico estático (0 hasta P-1) que representa un punto de conexión.
  # Board    : Colección de celdas interconectadas que forman el espacio topológico de juego.
  # Arrow    : Entidad inteligente (externa al grafo) que ocupa celdas y calcula su propia trayectoria.
  # Salida   : Puerto sin celda vecina conectada (apunta al vacío/fuera del board).
  # ─────────────────────────────────────────────

  Background: Topología pasiva y agnóstica
    Given que la topología de una celda se define por su cantidad total de puertos (P)
    And los puertos se indexan secuencialmente desde 0 hasta P-1
    And el tablero y sus celdas son contenedores pasivos (no calculan rutas de movimiento)
    And una celda válida debe instanciarse estrictamente con un número par de puertos (P % 2 == 0)


  # ══════════════════════════════════════════════
  # BLOQUE 1 — CREACIÓN DE CELDA Y TOPOLOGÍA
  # ══════════════════════════════════════════════

  Scenario: Creación de una celda con topología válida (ej. Cuadrado)
    When instancio una celda con 4 puertos
    Then la celda existe en memoria
    And tiene exactamente 4 puertos indexados del 0 al 3
    And todos sus puertos son inicialmente salidas (ninguno conectado)
    And su segmento de flecha es null

  Scenario: Creación de una celda con topología extendida (ej. Hexágono)
    When instancio una celda con 6 puertos
    Then tiene exactamente 6 puertos indexados del 0 al 5
    And todos sus puertos son inicialmente salidas (ninguno conectado)

  Scenario: Rechazo de celda con topología impar
    When intento instanciar una celda con 5 puertos
    Then el sistema lanza el error "TopologyError: port count must be an even number"

  Scenario: La capacidad topológica es inmutable después de la creación
    Given una celda instanciada con 4 puertos
    When intento mutar la cantidad de puertos de la celda a 6
    Then el sistema lanza el error "CellMutationError: port capacity is immutable after instantiation"


  # ══════════════════════════════════════════════
  # BLOQUE 2 — CELDA ÚNICA Y OCUPACIÓN PASIVA
  # ══════════════════════════════════════════════

  Scenario: Celda única tiene todos sus puertos libres
    Given un board con una única celda C1 de 4 puertos
    Then todos los puertos de C1 retornan isExit() == true
    And C1 no tiene vecinos referenciados

  Scenario: Celda única permite ser ocupada por la cabeza de una entidad
    Given un board con una única celda C1
    When el motor coloca un segmento de cabeza de flecha en C1
    Then C1.arrowSegment.isHead es true
    And C1 asume el estado de "ocupada" pasivamente

  Scenario: Celda única rechaza un segmento de cuerpo de flecha
    Given un board con una única celda C1
    When intento colocar un segmento de cuerpo (isHead == false) en C1
    Then el sistema lanza el error "ArrowPlacementError: body segment requires at least two connected cells"


  # ══════════════════════════════════════════════
  # BLOQUE 3 — CONEXIONES ESTRUCTURALES DEL GRAFO
  # ══════════════════════════════════════════════

  Scenario: Conexión bidireccional exitosa entre dos celdas
    Given una celda A de 4 puertos
    And una celda B de 4 puertos
    When conecto el puerto 1 de A con el puerto 3 de B
    Then el puerto 1 de A tiene como vecino a B
    And el puerto 3 de B tiene como vecino a A
    And el puerto 1 de A y el puerto 3 de B ya no son salidas

  Scenario: Rechazo de auto-conexión (bucle topológico)
    Given una celda A de 4 puertos
    When intento conectar el puerto 0 de A con el puerto 2 de A
    Then el sistema lanza el error "ConnectionError: a cell cannot connect to itself"

  Scenario: Rechazo de conexión en puerto ya ocupado
    Given una celda A conectada a B mediante (A.puerto[1] ↔ B.puerto[3])
    And una celda C disponible
    When intento conectar el puerto 1 de A con cualquier puerto de C
    Then el sistema lanza el error "ConnectionError: port 1 of cell A is already occupied"

  Scenario: Desconexión explícita libera los recursos en ambos extremos
    Given una celda A conectada a B mediante (A.puerto[1] ↔ B.puerto[3])
    When ejecuto la desconexión desde el puerto 1 de A
    Then el puerto 1 de A vuelve a ser salida
    And el puerto 3 de B vuelve a ser salida
    And las referencias topológicas en memoria entre A y B son destruidas


  # ══════════════════════════════════════════════
  # BLOQUE 4 — GESTIÓN DEL CONTENEDOR (BOARD)
  # ══════════════════════════════════════════════

  Scenario: Creación de un board vacío
    When inicializo un nuevo board
    Then el board existe en memoria
    And su colección interna de celdas está vacía

  Scenario: Agregación de nodos y construcción de la red pasiva
    Given un board vacío
    When agrego las celdas [C1, C2, C3] al board
    And conecto (C1.puerto[1] ↔ C2.puerto[3])
    And conecto (C2.puerto[1] ↔ C3.puerto[3])
    Then el board rastrea 3 celdas
    And C2 actúa como puente estructural teniendo 2 vecinos conectados
    And C1.puerto[3] y C3.puerto[1] permanecen como salidas

  Scenario: Rechazo de celdas duplicadas en el board
    Given un board que ya contiene la celda C1
    When intento agregar la referencia de C1 nuevamente al board
    Then el sistema lanza el error "BoardRegistryError: cell ID already exists in this board"

  Scenario: Eliminación de una celda aísla a sus vecinos
    Given un board con C1, C2 y C3, donde C2 está conectada a C1 y C3
    When remuevo C2 del board
    Then la conexión en C1 que apuntaba a C2 ahora es una salida
    And la conexión en C3 que apuntaba a C2 ahora es una salida
    And el board contiene 2 celdas en total

  Scenario: Rechazo de eliminación si la celda contiene una entidad activa
    Given un board con C1
    And C1 está actualmente ocupada por un segmento de flecha
    When intento remover C1 del board
    Then el sistema lanza el error "BoardMutationError: cannot remove an occupied cell"


  # ══════════════════════════════════════════════
  # BLOQUE 5 — CONSULTAS TOPOLÓGICAS (EL GRAFO NO DECIDE)
  # ══════════════════════════════════════════════

  Scenario: La celda responde consultas de adyacencia pasivamente sin calcular rutas
    Given una celda C1 de 4 puertos conectada a C2 en su puerto 2
    When la entidad activa (flecha) solicita conocer al vecino del puerto 2 en C1
    Then el sistema retorna la referencia estricta a C2
    And la celda C1 no ejecuta ninguna lógica aritmética modular sobre la dirección

  Scenario: La asimetría bidireccional se mantiene sincronizada estructuralmente
    Given una conexión activa entre A.puerto[X] y B.puerto[Y]
    Then consultar directamente el vecino del puerto X en A retorna B
    And consultar directamente el vecino del puerto Y en B retorna A