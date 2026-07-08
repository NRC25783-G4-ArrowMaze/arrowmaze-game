# C4-pantallas-soporte.feature

Feature: Pantallas de soporte del juego — inicio, victoria, derrota, pausa y ajustes
  Como jugador en un cliente web/Android
  Quiero pantallas de soporte que acompañen el ciclo de vida de la partida
  Para iniciar el juego, pausar sin perder estado, ver el resultado y configurar mis preferencias

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # GameOverlay        : Overlay existente de fin de partida (Victoria/Derrota). Ya implementado.
  # GameFlowController : Autómata de pila de C1 (ACTIVE | PAUSED | SETTINGS), ya implementado
  #                      y conectado a useGameController/GameView. PAUSED y SETTINGS ya existen.
  # PauseOverlay       : Overlay nuevo (C4). Visible cuando el tope de la pila es PAUSED.
  #                      Acciones: Reanudar / Reiniciar / Ajustes / Salir.
  # SettingsOverlay    : Overlay nuevo (C4). Visible cuando el tope de la pila es SETTINGS.
  #                      Contenedor con placeholders de idioma (→ G2) y audio (→ G1);
  #                      "Volver" desapila SETTINGS y regresa a PAUSED, nunca a ACTIVE.
  # Inicio             : Ya cubierto por LevelSelectScreen (C3) — no se construye pantalla nueva.
  # Navegación         : Reversible y sin estados huérfanos (toda pantalla de soporte tiene
  #                      una acción visible que retrocede o sale de la partida).
  # ─────────────────────────────────────────────

  Background: Partida en curso con la pila de flujo de C1 operativa
    Given una GameSession con status IN_PROGRESS envuelta por un GameFlowController
    And la pila de flujo es [ACTIVE]
    And el overlay de fin de partida (GameOverlay) ya cubre WON y LOST
    And la pantalla de selección de niveles (LevelSelectScreen, C3) ya cumple el rol de Inicio

  Rule: Pausar congela el input del tablero sin perder el estado de la partida

    Scenario: Pausar durante una partida activa muestra el overlay de pausa
      Given la pila de flujo es [ACTIVE]
      When el jugador toca el botón de Pausa
      Then la pila de flujo pasa a [ACTIVE, PAUSED]
      And se muestra el PauseOverlay sobre el tablero
      And el tablero deja de aceptar toques
      And los movimientos restantes y las posiciones de las flechas quedan intactos

    Scenario: Pausar mientras un deslizamiento está en vuelo no hace nada
      Given hay un deslizamiento de flecha en curso
      When el jugador toca el botón de Pausa
      Then la pila de flujo permanece en [ACTIVE]
      And no se muestra el PauseOverlay

  Rule: Reanudar retoma la partida exactamente donde quedó

    Scenario: Reanudar desapila PAUSED y desbloquea el tablero
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador toca "Reanudar" en el PauseOverlay
      Then la pila de flujo vuelve a [ACTIVE]
      And el PauseOverlay deja de mostrarse
      And el tablero vuelve a aceptar toques
      And los movimientos restantes y las posiciones de las flechas son idénticos a antes de pausar

  Rule: Reiniciar desde Pausa descarta la partida actual y arranca una fresca

    Scenario: Reiniciar crea una GameSession nueva sobre la misma escena
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador toca "Reiniciar" en el PauseOverlay
      Then se crea una GameSession nueva sobre la misma escena con los movimientos iniciales completos
      And la pila de flujo colapsa a [ACTIVE]
      And el tablero se muestra con la disposición inicial de flechas

  Rule: Salir desde Pausa navega fuera de la partida sin transicionar el flujo

    Scenario: Salir vuelve a la selección de niveles descartando la partida
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador toca "Salir" en el PauseOverlay
      Then la aplicación navega a la pantalla de selección de niveles (C3)
      And no se invoca ninguna transición del GameFlowController antes de navegar
      And la partida y su GameFlowController se descartan al desmontar la vista de juego

  Rule: Ajustes es un contenedor accesible solo desde Pausa

    Scenario: Abrir Ajustes apila SETTINGS sobre PAUSED
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador toca "Ajustes" en el PauseOverlay
      Then la pila de flujo pasa a [ACTIVE, PAUSED, SETTINGS]
      And se muestra el SettingsOverlay con las secciones "Idioma" y "Audio" como "Próximamente"
      And el PauseOverlay deja de mostrarse mientras SETTINGS está en el tope

    Scenario: Volver desde Ajustes regresa a Pausa, nunca directo a la partida
      Given la pila de flujo es [ACTIVE, PAUSED, SETTINGS]
      When el jugador toca "Volver" en el SettingsOverlay
      Then la pila de flujo vuelve a [ACTIVE, PAUSED]
      And se vuelve a mostrar el PauseOverlay
      And el tablero sigue sin aceptar toques

  Rule: La navegación entre pantallas de soporte es reversible y sin estados huérfanos

    Scenario Outline: Toda pantalla de soporte tiene una acción visible de regreso
      Given el tope de la pila de flujo es <estado>
      Then existe una acción visible "<accion>" que lleva a <destino>

      Examples:
        | estado   | accion   | destino                |
        | PAUSED   | Reanudar | ACTIVE                 |
        | PAUSED   | Salir    | selección de niveles   |
        | SETTINGS | Volver   | PAUSED                 |
