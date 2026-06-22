Feature: Movimiento continuo de la Flecha por toque (deslizamiento hasta detenerse)

  Como jugador
  Quiero que al tocar una flecha avance de corrido hasta chocar o salir del tablero
  Para resolver el nivel con un solo gesto por flecha en vez de un toque por celda

  # ─────────────────────────────────────────────
  # CONTEXTO Y ALCANCE
  # Hoy (PR #10, B3): un toque = un tick = Arrow.advance() = una celda.
  # Propuesta: un toque = N ticks, iterando Arrow.advance() hasta que el outcome
  #            del dominio sea 'blocked' o 'destroyed' (salir del tablero == destroyed),
  #            o hasta una cota de seguridad maxTicks.
  #
  # CAPA: la iteración vive en aplicación/presentación (nuevo PlayContinuousMoveUseCase
  #       que envuelve la maquinaria existente). El DOMINIO NO CAMBIA: Arrow.advance()
  #       sigue siendo un tick atómico de una sola celda.
  #
  # OUTCOMES DE DOMINIO (value object AdvanceResult), sin cambios:
  #   advanced  : la cabeza reclamó 1 celda nueva, la cola liberó 1.
  #   blocked   : el puerto destino estaba ocupado -> rollback atómico, sin mutación.
  #   destroyed : la cabeza fluyó a un sumidero (exit) -> la flecha se purga.
  # ─────────────────────────────────────────────
  # /!\ DECISIONES DE ECONOMÍA ABIERTAS (requieren aprobación — ver doc/continuous-movement_plan.md)
  #   D1: ¿cuántos movimientos consume un toque continuo? (1 por toque vs N por celda)
  #   D2: ¿cómo cuentan los ticks para el score? (timeScore = 1000 - ticksUsed x 2)
  #   D3: ¿semántica de penalización cuando el deslizamiento termina en 'blocked'?
  # Los escenarios marcados @pending @decision-required NO se implementan hasta resolverlas.
  # ─────────────────────────────────────────────

  Background:
    Given un tablero pasivo con celdas de P=4 puertos
    And un controlador de movimiento continuo con una cota de seguridad maxTicks
    And la regla de parada: iterar Arrow.advance() mientras el outcome sea 'advanced'

  # ══════════════════════════════════════════════
  # BLOQUE 1 — DESLIZAMIENTO DETERMINISTA (comportamiento decidido)
  # ══════════════════════════════════════════════

  Scenario: Un toque desliza la flecha hasta salir del tablero
    Given la Flecha colocada en [C1(head, exitPort:2)] con ruta libre C1->C2->C3->exit
    When el jugador toca la Flecha una sola vez
    Then el controlador itera Arrow.advance() de corrido
    And la Flecha avanza C1->C2 (advanced), C2->C3 (advanced), C3->exit (destroyed)
    And el deslizamiento se detiene al outcome 'destroyed'
    And la Flecha liberó el grafo en un solo gesto (3 ticks acumulados)

  Scenario: Un toque desliza hasta chocar con una celda ocupada
    Given la Flecha F1 en [C1(head, exitPort:2)] con ruta C1->C2->C3
    And la celda C3 ocupada por otra entidad
    When el jugador toca F1 una sola vez
    Then F1 avanza C1->C2 (advanced)
    And F1 intenta C2->C3 y recibe 'blocked' (rollback atómico)
    And el deslizamiento se detiene con la cabeza anclada en C2
    And C3 jamás es alterada

  Scenario: Toque sobre una flecha ya bloqueada no produce avance
    Given la Flecha F1 en [C1(head, exitPort:2)] con la celda destino ya ocupada
    When el jugador toca F1 una sola vez
    Then el primer Arrow.advance() devuelve 'blocked'
    And el deslizamiento se detiene sin ninguna celda reclamada (0 avances)

  Scenario: La cota de seguridad maxTicks corta deslizamientos anómalos
    Given una configuración de tablero que pudiera inducir un bucle (defensivo)
    When el jugador toca la Flecha una sola vez
    Then el controlador nunca itera más de maxTicks veces
    And se garantiza la terminación del gesto

  # ══════════════════════════════════════════════
  # BLOQUE 2 — GATING (consistente con PR #10)
  # ══════════════════════════════════════════════

  Scenario: El input continuo se ignora en estado terminal
    Given una sesión cuyo estado es WON o LOST
    When el jugador toca una Flecha
    Then el controlador no inicia ningún deslizamiento

  Scenario: No se aceptan toques mientras hay un deslizamiento en curso
    Given un deslizamiento continuo en progreso (animación en vuelo)
    When el jugador toca otra Flecha
    Then el segundo toque se descarta hasta que el deslizamiento actual termine

  # ══════════════════════════════════════════════
  # BLOQUE 3 — ECONOMÍA (DECISIÓN ABIERTA — no implementar aún)
  # ══════════════════════════════════════════════

  @pending @decision-required
  Scenario: D1 — ¿Cuántos movimientos consume un toque continuo?
    Given la Flecha desliza N celdas en un solo toque
    When el deslizamiento termina
    Then session.movesRemaining debe disminuir según la opción elegida
    # Opción A (UX simple): 1 movimiento por toque, sin importar N
    # Opción B (preserva la economía por celda actual): N movimientos (uno por celda recorrida)
    # SIN RESOLVER — ver doc/continuous-movement_plan.md

  @pending @decision-required
  Scenario: D2 — ¿Cómo cuentan los ticks para el score?
    Given timeScore = max(0, 1000 - ticksUsed x 2)
    And la Flecha desliza N celdas en un solo toque
    Then ticksUsed debe aumentar según la opción elegida
    # Opción A: +N (cada celda recorrida suma un tick — mantiene el decay actual)
    # Opción B: +1 (un toque = un tick — premia el deslizamiento largo)
    # SIN RESOLVER — ver doc/continuous-movement_plan.md

  @pending @decision-required
  Scenario: D3 — Penalización cuando el gesto termina en 'blocked'
    Given una Flecha cuyo deslizamiento termina en outcome 'blocked'
    Then se debe decidir la semántica de falla/penalización
    # Opción A: el 'blocked' final cuenta como una falla (racha + penalización, como hoy)
    # Opción B: solo penaliza si el toque no avanzó ninguna celda; si avanzó >=1, no penaliza
    # SIN RESOLVER — ver doc/continuous-movement_plan.md
