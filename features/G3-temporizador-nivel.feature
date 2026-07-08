# G3-temporizador-nivel.feature

Feature: Temporizador visual por nivel
  Como jugador en un cliente web/Android
  Quiero ver cuánto tiempo llevo en el nivel
  Para tener noción del tiempo sin que el reloj pueda hacerme perder la partida

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # Tiempo activo   : Segundos transcurridos con la partida en IN_PROGRESS y la
  #                   UI fuera de PAUSED. Es lo que el timer muestra.
  # IClock          : Puerto de reloj inyectable. La implementación real vive en
  #                   Infrastructure; los tests inyectan un reloj falso. Ningún
  #                   componente lee el reloj del sistema directamente.
  # Tick            : Unidad de movimiento del motor (A3). Los ticks siguen siendo
  #                   movimientos: NO se mezclan con segundos.
  # ─────────────────────────────────────────────
  #
  # INVARIANTE CENTRAL (v1 — alcance de esta spec)
  #
  # El temporizador vive íntegramente en la capa de PRESENTACIÓN: no dispara
  # ticks, no causa derrota y no escribe en el dominio. Con un reloj falso su
  # comportamiento es 100% reproducible.
  #
  # ⚠️ DECISIÓN ABIERTA — P23 (integración con el score)
  #
  # Está DECIDIDO que el tiempo debe afectar el score (decisión del equipo,
  # 2026-07-04): es necesaria. Lo que queda POR DECIDIR es el CÓMO
  # implementarlo, porque cualquier mecanismo toca el dominio (A5, ya
  # implementado en el cliente). Candidatos evaluados en la sesión SDD:
  #   a) Término aditivo nuevo: − (segundosActivos × TIME_DECAY) — favorito
  #      preliminar; requiere enmienda de A5 y puerto IClock hasta Application.
  #   b) Conversión segundos → ticks a tasa fija (reusa el término DECAY, pero
  #      redefine qué significa "tick").
  #   c) Bonus por rapidez bajo umbral (no penaliza; requiere umbral por nivel).
  # Esa integración se cerrará en su propia sesión SDD (enmienda de A5) y NO
  # forma parte del alcance de esta spec. Mientras tanto, el timer es solo
  # visual y esta feature no modifica Dominio ni Aplicación.
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-04)
  #   D1  Dirección        : CUENTA HACIA ARRIBA, sin límite. El tiempo nunca
  #                          causa derrota; la derrota sigue siendo solo por
  #                          agotar movimientos (A4).
  #   D2  Formato          : mm:ss (p. ej. 02:35). Horas no contempladas en v1.
  #   D3  Determinismo     : RELOJ INYECTABLE (puerto IClock). Reloj real en
  #                          Infrastructure, reloj falso en tests. Este puerto
  #                          es además el prerequisito técnico para la futura
  #                          integración con el score (P23).
  #   D4  Pausa            : El timer se CONGELA en PAUSED (C4) y se DETIENE en
  #                          WON/LOST. `restart` reinicia el timer a 00:00.

  Background: una partida con reloj inyectado
    Given una partida IN_PROGRESS cuyo tiempo se mide a través del puerto IClock
    And el timer visual se muestra en formato mm:ss

  Rule: El timer cuenta hacia arriba y nunca termina la partida (D1)

    Scenario: El timer arranca en cero al iniciar el nivel
      Given el jugador inicia un nivel
      When la partida queda en estado IN_PROGRESS
      Then el timer visual muestra "00:00"
      And comienza a avanzar un segundo por cada segundo del IClock

    Scenario: El tiempo alto no causa derrota
      Given una partida IN_PROGRESS con 59 minutos de tiempo activo
      And al jugador aún le quedan movimientos disponibles
      When el tiempo sigue avanzando
      Then la partida permanece IN_PROGRESS
      And ninguna transición a LOST se origina en el tiempo

    Scenario: Reiniciar el nivel reinicia el timer
      Given una partida con 03:20 de tiempo activo
      When el jugador ejecuta `restart`
      Then el timer visual vuelve a "00:00"

  Rule: El timer se congela en pausa y se detiene en estados terminales (D4)

    Scenario: La pausa congela el timer sin perder el acumulado
      Given una partida con 01:30 de tiempo activo
      When el flujo de UI entra en PAUSED (C4)
      And transcurren 45 segundos de reloj real
      And el jugador reanuda la partida
      Then el timer visual muestra "01:30" al reanudar
      And los 45 segundos de pausa no cuentan como tiempo activo

    Scenario: La victoria detiene el timer definitivamente
      Given una partida con 02:10 de tiempo activo
      When la GameSession transiciona a WON
      Then el timer se detiene en 02:10
      And el valor queda visible en el overlay de fin de partida junto al score

    Scenario: La derrota también detiene el timer
      Given una partida con 04:00 de tiempo activo
      When la GameSession transiciona a LOST
      Then el timer se detiene
      And el tiempo mostrado no altera el score NULL de A5

  Rule: El timer no toca el dominio — es una proyección de presentación

    Scenario: Dos partidas idénticas con tiempos distintos producen el mismo score
      Given dos partidas ganadas con idénticos ticks, fallos y condición flawless
      And la primera acumuló 30 segundos activos y la segunda 120 segundos activos
      When se calcula el score final de ambas (A5 vigente)
      Then ambos scores son idénticos
      # NOTA: este escenario caduca cuando se cierre P23 (integración tiempo→score)
      # y se enmiende A5; se actualizará en esa sesión SDD.

    Scenario: El timer nunca escribe en el dominio
      Given una partida IN_PROGRESS con el timer avanzando
      Then ninguna entidad del dominio recibe lecturas ni eventos del timer
      And desactivar el timer visual deja el estado del juego idéntico

  Rule: El reloj es un puerto inyectable — el determinismo se preserva (D3)

    Scenario: Con un reloj falso el timer es reproducible
      Given la misma secuencia de movimientos se ejecuta dos veces
      And ambas ejecuciones inyectan un IClock falso que reporta los mismos instantes
      When ambas partidas terminan
      Then el tiempo activo medido es idéntico en ambas

    Scenario: Ningún componente consulta el reloj del sistema directamente
      Given el timer consume el tiempo a través del puerto IClock
      Then reemplazar la implementación de IClock no requiere cambios en el timer
      And los tests controlan el avance del tiempo sin esperas reales

  Rule: Presentación en formato mm:ss (D2)

    Scenario Outline: Los segundos activos se formatean como mm:ss
      Given una partida con <segundos> segundos activos
      When el timer visual se renderiza
      Then muestra "<display>"

      Examples:
        | segundos | display |
        | 0        | 00:00   |
        | 5        | 00:05   |
        | 65       | 01:05   |
        | 754      | 12:34   |
