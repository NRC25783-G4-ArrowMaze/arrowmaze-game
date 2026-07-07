# C1-maquina_estados_partida.feature

Feature: Máquina de estados del flujo de una partida (autómata de pila)
  Como jugador en un cliente web/Android
  Quiero pausar, reanudar, reiniciar o salir de una partida en curso sin perder su progreso
  Para poder interrumpir el juego (ajustes, distracciones) sin que eso cuente como derrota

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # GameStatus      : Veredicto del MOTOR (A4). IN_PROGRESS | WON | LOST. Vive en
  #                   Dominio, en GameSession. Esta feature NO le agrega valores.
  # GameFlowState   : Estado de FLUJO DE UI. ACTIVE | PAUSED | SETTINGS. Vive en
  #                   Presentación/Aplicación, nunca en Dominio.
  # Pila de flujo   : Autómata de pila (Pushdown Automaton, convención estándar de
  #                   la industria desde los primeros motores de plataformas).
  #                   Al apilar un estado, el estado inferior NO se destruye ni
  #                   reinicia: queda suspendido. Al desapilar, se retoma
  #                   exactamente donde quedó. Solo el TOPE de la pila recibe
  #                   input/render.
  # GameSession     : Aggregate de Dominio (A4/A5). Se instancia UNA vez al
  #                   iniciar el nivel y persiste intacta mientras la pila solo
  #                   apila/desapila PAUSED/SETTINGS sobre ella.
  # ─────────────────────────────────────────────
  #
  # INVARIANTE CENTRAL
  #
  # Este feature es puramente de PRESENTACIÓN/APLICACIÓN: no introduce estados
  # nuevos en GameStatus, no dispara evaluateStatus(), no escribe en GameSession
  # salvo para reemplazarla por completo (restart) o descartarla (exit). El
  # Dominio (A4/A5) permanece exactamente como está implementado hoy.
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-07)
  #   D1  Ubicación de PAUSED : Autómata de pila en Presentación/Aplicación, NO en
  #                             GameStatus. Reconciliado con G3 (ya cerrada), que
  #                             asume "la UI fuera de PAUSED" como condición de
  #                             tiempo activo — si PAUSED fuera parte de
  #                             GameStatus, G3 ya estaría rota.
  #   D2  Alcance de MENU      : FUERA de esta feature. "No hay partida" es
  #                             ausencia de GameSession (routing de C3), no un
  #                             estado de esta pila. La pila de C1 solo existe
  #                             mientras hay un nivel cargado.
  #   D3  Reglas de pausa      : Solo se puede pausar desde ACTIVE con
  #                             GameSession.status == IN_PROGRESS. El reloj
  #                             (G3) se congela porque ACTIVE deja de recibir
  #                             ticks de render mientras no es el tope.
  #   D4  Salidas de PAUSED    : RESUME (vuelve a ACTIVE), RESTART (nueva
  #                             GameSession, pila vuelve a [ACTIVE]) y EXIT
  #                             (descarta GameSession y pila completa; el
  #                             destino de navegación es responsabilidad de C3,
  #                             fuera de esta feature).
  #   D5  Ajustes anidados     : SETTINGS se apila SOLO sobre PAUSED (abrir
  #                             ajustes durante el juego implica pausar primero).
  #                             Cerrar ajustes desapila y vuelve a PAUSED, no a
  #                             ACTIVE directamente — evita saltarse la pausa.
  # ─────────────────────────────────────────────

  Background: Un nivel cargado con su GameSession de Dominio ya instanciada
    Given un nivel cargado con allowedMoves = N declarado en LevelData
    And una GameSession instanciada con movesRemaining = N y status = IN_PROGRESS
    And una pila de flujo GameFlowController inicializada en [ACTIVE]

  # ══════════════════════════════════════════════
  Rule: El tope de la pila es el único estado que recibe input y se renderiza

    Ningún estado inferior al tope procesa input del jugador ni se actualiza;
    queda suspendido tal cual estaba, sin destruirse.

    Scenario: Con la pila en [ACTIVE], el juego recibe input normalmente
      Given la pila de flujo es [ACTIVE]
      When el jugador interactúa con el tablero
      Then el input llega a PlayMoveUseCase (B3)

    Scenario: Con PAUSED apilado, el juego bajo el tope no recibe input
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador intenta interactuar con el tablero
      Then ningún PlayMoveCommand llega a PlayMoveUseCase
      And la GameSession no se muta de ninguna forma

  # ══════════════════════════════════════════════
  Rule: Pausar apila PAUSED sin destruir ni reiniciar el estado activo (D1, D3)

    Scenario: Pausar durante una partida en curso apila PAUSED
      Given la pila de flujo es [ACTIVE]
      And la GameSession tiene status = IN_PROGRESS, movesRemaining = 4
      When el jugador dispara el evento de pausa
      Then la pila de flujo queda en [ACTIVE, PAUSED]
      And la GameSession conserva movesRemaining = 4 y status = IN_PROGRESS
      And ningún contador del ScoringTracker (A5) se altera

    Scenario: No se puede pausar si la GameSession ya es terminal
      Given la GameSession tiene status = WON
      And la pila de flujo es [ACTIVE]
      When el jugador intenta disparar el evento de pausa
      Then la pila de flujo permanece en [ACTIVE]
      And se lanza InvalidFlowTransitionError

    Scenario: No se puede pausar si el tope de la pila no es ACTIVE
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador intenta disparar el evento de pausa de nuevo
      Then la pila de flujo permanece en [ACTIVE, PAUSED]
      And se lanza InvalidFlowTransitionError

  # ══════════════════════════════════════════════
  Rule: Reanudar desapila PAUSED y retoma exactamente donde quedó

    Scenario: Reanudar vuelve a ACTIVE sin alterar la GameSession
      Given la pila de flujo es [ACTIVE, PAUSED]
      And la GameSession tiene movesRemaining = 4, status = IN_PROGRESS
      When el jugador dispara el evento de reanudar
      Then la pila de flujo queda en [ACTIVE]
      And la GameSession sigue teniendo movesRemaining = 4, status = IN_PROGRESS

    Scenario: No se puede reanudar si el tope de la pila no es PAUSED
      Given la pila de flujo es [ACTIVE]
      When el jugador dispara el evento de reanudar
      Then la pila de flujo permanece en [ACTIVE]
      And se lanza InvalidFlowTransitionError

  # ══════════════════════════════════════════════
  Rule: Ajustes se apila solo sobre PAUSED y nunca se salta la pausa al cerrarse (D5)

    Scenario: Abrir ajustes desde pausa apila SETTINGS
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador abre Ajustes
      Then la pila de flujo queda en [ACTIVE, PAUSED, SETTINGS]
      And la GameSession permanece intacta

    Scenario: No se puede abrir ajustes si el tope no es PAUSED
      Given la pila de flujo es [ACTIVE]
      When el jugador intenta abrir Ajustes
      Then la pila de flujo permanece en [ACTIVE]
      And se lanza InvalidFlowTransitionError

    Scenario: Cerrar ajustes vuelve a PAUSED, no a ACTIVE
      Given la pila de flujo es [ACTIVE, PAUSED, SETTINGS]
      When el jugador cierra Ajustes
      Then la pila de flujo queda en [ACTIVE, PAUSED]
      And el jugador debe reanudar explícitamente para volver a jugar

  # ══════════════════════════════════════════════
  Rule: Reiniciar reemplaza la GameSession por una nueva y colapsa la pila a [ACTIVE] (D4)

    Scenario: Reiniciar desde pausa descarta la GameSession actual
      Given la pila de flujo es [ACTIVE, PAUSED]
      And la GameSession actual tiene movesRemaining = 1, con fallas acumuladas en su ScoringTracker
      When el jugador dispara el evento de reiniciar
      Then se crea una nueva GameSession con movesRemaining = N (el original del nivel) y status = IN_PROGRESS
      And su ScoringTracker inicia en cero
      And la pila de flujo queda en [ACTIVE]

    Scenario: No se puede reiniciar si el tope de la pila no es PAUSED
      Given la pila de flujo es [ACTIVE]
      When el jugador dispara el evento de reiniciar
      Then la pila de flujo permanece en [ACTIVE]
      And se lanza InvalidFlowTransitionError

  # ══════════════════════════════════════════════
  Rule: Salir descarta la GameSession y toda la pila, sin persistir progreso parcial (D4)

    Scenario: Salir desde pausa termina el flujo de la partida
      Given la pila de flujo es [ACTIVE, PAUSED]
      When el jugador dispara el evento de salir
      Then la GameFlowController y su GameSession quedan descartadas
      And no se persiste ningún progreso parcial de esta partida
      And el destino de navegación posterior (menú, selección de niveles) es responsabilidad de C3/routing, fuera de esta feature

  # ══════════════════════════════════════════════
  Rule: El Dominio permanece ajeno a esta feature

    Ningún escenario de esta feature invoca evaluateStatus(), muta movesRemaining
    directamente, ni agrega valores a GameStatus. Solo instancia o descarta
    GameSession completas.

    Scenario: GameStatus nunca incluye PAUSED ni SETTINGS
      Given cualquier secuencia válida de eventos de flujo sobre una GameSession
      Then GameSession.status solo puede observarse como IN_PROGRESS, WON o LOST
      And PAUSED/SETTINGS solo existen como GameFlowState, nunca como GameStatus

# Out of scope for this feature (deferred to otras specs):
#   - Las pantallas concretas (botones, layout, textos) de pausa/ajustes/inicio (C4)
#   - Congelar/reanudar el reloj visual en sí (G3, ya especificada y consistente con esta FSM)
#   - Pantalla de Inicio / MENU previa a que exista una GameSession (routing, C3)
#   - Persistencia de progreso parcial al salir (D1/D2, pendientes)
#   - Atajos de teclado o gestos para pausar (Presentation, detalle de implementación)
