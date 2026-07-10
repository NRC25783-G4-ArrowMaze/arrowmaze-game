# G4-modo-oscuro.feature

Feature: Modo oscuro con cambio en caliente (claro / oscuro)
  Como jugador
  Quiero alternar entre tema claro y oscuro desde Ajustes o el header del mapa
  Para jugar cómodo en ambientes con poca luz sin perder legibilidad

  # ─────────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # Token       : Variable CSS (--bg, --surface, --text…) definida en :root
  #               (claro) y sobreescrita en [data-theme="dark"]; ningún color
  #               de la UI en alcance vive hardcodeado en los componentes.
  # Preferencia : Tema elegido por el usuario, persistido a nivel de usuario
  #               (ui_theme_preference); prevalece sobre prefers-color-scheme
  #               en próximos arranques.
  # Toggle      : Botón icono del header del mapa (☀️/🌙). Misma fuente de
  #               verdad que el selector de Ajustes (useTheme).
  # ─────────────────────────────────────────────────
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-10)
  #   D1 Opciones   : 2 (claro/oscuro), sin opción "sistema". Trade-off
  #                   consciente: elegir manualmente una vez desactiva el
  #                   seguimiento del SO para siempre.
  #   D2 Resolución : guardada > prefers-color-scheme > claro.
  #   D3 Regla B1   : los colores de las flechas son DATO del nivel y no
  #                   cambian con el tema; el lienzo y la grilla sí (tokens
  #                   --board-bg / --board-dot vía var() en el SVG inline).
  #   D4 Alcance    : Forge (H1) y la página /preview quedan fuera del v1 y
  #                   conservan su paleta propia.

  Scenario: Resolución inicial sin preferencia guardada sigue al sistema
    Given que nunca elegí un tema
    And mi sistema prefiere el esquema oscuro
    When abro la aplicación
    Then la interfaz arranca en tema oscuro

  Scenario: La preferencia guardada prevalece sobre el sistema
    Given que elegí el tema claro anteriormente
    And mi sistema prefiere el esquema oscuro
    When abro la aplicación
    Then la interfaz arranca en tema claro

  Scenario: Cambio en caliente desde Ajustes sin perder la partida
    Given una partida en curso con movimientos acumulados
    When cambio el tema desde el selector de Ajustes
    Then toda la interfaz cambia de tema al instante, tablero SVG incluido
    And el estado de la partida se conserva intacto

  Scenario: El toggle del header refleja el estado y alterna con un tap
    Given el tema claro activo
    Then el toggle del header muestra ☀️
    When toco el toggle
    Then el tema pasa a oscuro y el icono pasa a 🌙
    And el selector de Ajustes marca "Oscuro" como activo al instante

  Scenario: La elección persiste entre sesiones
    When elijo el tema oscuro
    And reinicio la aplicación
    Then la interfaz arranca en tema oscuro
