Feature: Deslizamiento de flecha por click (un click = ticks hasta terminal)

  Como jugador
  Quiero que un solo click deslice la flecha celda a celda hasta que salga o choque
  Para no tener que emitir un tick por cada celda (igual que los juegos de referencia)

  # ─────────────────────────────────────────────
  # CONTEXTO
  # El dominio expone advance() = 1 tick = 1 celda (atómico, correcto, NO se toca).
  # Este feature vive en APLICACIÓN: orquesta un bucle de advance() hasta que el
  # outcome deja de ser 'advanced' (es decir, hasta 'blocked' o 'destroyed').
  #
  # SlideArrowUseCase reutiliza AdvanceArrowUseCase (motor) sin reimplementar
  # ninguna regla de trayectoria/colisión: solo encadena ticks y consolida el
  # resultado para la sesión y la animación.
  # ─────────────────────────────────────────────

  Background:
    Given un tablero pasivo con celdas de 4 puertos
    And una GameSession IN_PROGRESS con presupuesto de movimientos suficiente
    And un AdvanceArrowUseCase real (sin mocks)

  # ══════════════════════════════════════════════
  # BLOQUE 1 — DESLIZAMIENTO HASTA SALIR
  # ══════════════════════════════════════════════

  Scenario: Una flecha de cabeza-única se desliza hasta salir del tablero
    Given una flecha cuya ruta libre hasta un sumidero es de 3 celdas
    When el jugador dispara un slide (un click)
    Then el caso de uso encadena advance() repetidamente
    And la flecha avanza tick a tick (advanced, advanced, ...) hasta el borde
    And el outcome final es 'destroyed'
    And el resultado expone la trayectoria de ticks en orden

  # ══════════════════════════════════════════════
  # BLOQUE 2 — DESLIZAMIENTO HASTA CHOCAR
  # ══════════════════════════════════════════════

  Scenario: El slide se detiene cuando la cabeza topa con una flecha ajena
    Given una segunda flecha ocupando una celda en la ruta, a 2 celdas de distancia
    When el jugador dispara un slide
    Then la flecha avanza hasta la celda previa a la ocupada
    And el siguiente tick devuelve 'blocked'
    And el bucle se detiene en ese 'blocked'
    And el outcome final es 'blocked'
    And ni la flecha ni la celda ajena quedan en estado corrupto

  Scenario: Una flecha sin avance posible se bloquea en el primer tick
    Given una flecha cuya celda destino inmediata está ocupada por otra entidad
    When el jugador dispara un slide
    Then el primer advance() devuelve 'blocked'
    And el bucle termina sin desplazamiento
    And el outcome final es 'blocked'

  # ══════════════════════════════════════════════
  # BLOQUE 3 — SESIÓN Y PRESUPUESTO
  # ══════════════════════════════════════════════

  Scenario: Un slide consume exactamente un movimiento (no uno por tick)
    Given una sesión con movesRemaining = 5
    And una flecha cuya ruta hasta el sumidero es de 3 celdas
    When el jugador dispara un slide
    Then la sesión queda con movesRemaining = 4
    And NO se consume un movimiento por cada tick interno

  Scenario: El status se re-evalúa una sola vez al final del slide
    Given el slide vacía la última flecha del tablero
    When el jugador dispara un slide
    Then evaluateStatus() se invoca una vez tras consolidar el slide
    And el gameStatus resultante es 'WON'

  Scenario: Un slide sobre una sesión terminal es rechazado
    Given una GameSession en estado WON o LOST
    When el jugador dispara un slide
    Then no se ejecuta ningún advance()
    And el resultado es success=false con el estado terminal de la sesión

  # ══════════════════════════════════════════════
  # BLOQUE 4 — FRONTERA DE CAPAS
  # ══════════════════════════════════════════════

  Scenario: El caso de uso no reimplementa lógica de dominio
    Given que toda regla de avance/colisión/destrucción vive en Arrow.advance()
    When SlideArrowUseCase resuelve un slide
    Then solo delega en AdvanceArrowUseCase y consulta outcomes
    And no calcula trayectorias, puertos ni ocupación por su cuenta
