# C4-pantallas-soporte.feature

Feature: Pantallas de soporte del juego — inicio, victoria, derrota, pausa y ajustes
  Como jugador en un cliente web/Android
  Quiero pantallas de soporte que acompañen el ciclo de vida de la partida
  Para iniciar el juego, pausar sin perder estado, ver el resultado y configurar mis preferencias

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # GameOverlay     : Overlay existente de fin de partida (cubre Victoria/Derrota).
  # Estado de flujo : Estado de UI que determina qué pantalla se muestra
  #                   (MENU, IN_PROGRESS, PAUSED, WON, LOST); PAUSED aún no existe.
  # Pausa           : Congela el reloj (→ G3) sin perder estado de tablero/flechas.
  # Ajustes         : Contenedor que enlaza idioma (→ G2) y audio/volumen (→ G1).
  # Inicio          : Entrada al juego / acceso a selección de niveles (→ C3).
  # Navegación      : Reversible y sin estados huérfanos (toda pantalla puede
  #                   volver al menú).
  # ─────────────────────────────────────────────

  Background: Cliente con ciclo de vida de partida activo
    Given un cliente con la máquina de estados de partida de C1 operativa
    And el overlay de fin de partida (GameOverlay) ya implementado para WON/LOST
    # TODO: completar el contexto compartido (estado de flujo inicial, nivel cargado, etc.)

  # ─────────────────────────────────────────────
  # ESCENARIOS (pendientes de redactar)
  # ─────────────────────────────────────────────

  Scenario: [TODO] Pantalla de inicio como entrada al juego
    Given <contexto>
    When <acción>
    Then <resultado esperado>

  # Scenario: [TODO] Pausa congela el reloj y preserva el estado del tablero
  # Scenario: [TODO] Reanudar / Reiniciar / Salir desde la pantalla de pausa
  # Scenario: [TODO] Pantalla de ajustes enlaza idioma (G2) y audio (G1)
  # Scenario: [TODO] Navegación reversible: toda pantalla puede volver al menú
