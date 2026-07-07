# G1-audio-sfx-musica.feature

Feature: Sistema de audio — efectos de sonido y música de fondo
  Como jugador en un cliente web/Android
  Quiero escuchar efectos de sonido ante los resultados del motor y música durante la partida
  Para percibir retroalimentación sonora de lo que el juego decidió, sin que el audio altere el juego

  # ─────────────────────────────────────────────
  # CONCEPTOS CONSUMIDOS (SOLO LECTURA — ver A3, B2, C1, C4)
  #
  # Esta es una feature de PRESENTACIÓN / INFRAESTRUCTURA. Consume outcomes
  # ya resueltos; nunca los produce, altera ni reordena.
  #
  # Outcome        : Resultado ya decidido de un tick para una flecha (patrón
  #                  "caller" de B2): advanced | blocked | exited (salida/destrucción).
  # Estado terminal: Transición de GameSession a WON o LOST (C1).
  # Ajustes        : Pantalla contenedora de C4 donde viven los controles de audio.
  # Preferencias   : Valores de audio del usuario (mute, volumen SFX, volumen música),
  #                  persistidos a nivel de usuario/perfil (mecanismo de almacenamiento
  #                  según D1; el contrato aquí es el puerto, no la tecnología).
  # ─────────────────────────────────────────────
  #
  # INVARIANTE CENTRAL
  #
  # El audio es una proyección de solo lectura del estado del juego. Silenciar,
  # fallar o retrasar cualquier sonido deja el estado del dominio y el resultado
  # de la partida idénticos. Ningún evento de audio fluye hacia el dominio.
  #
  # NOTA DE ALTITUD
  #
  # Esta spec fija COMPORTAMIENTO e INVARIANTES. Los assets concretos, formatos
  # de archivo, curvas de volumen y librería de reproducción pertenecen al plan
  # de implementación del cliente.
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-04)
  #   P22 Origen de assets : EMPAQUETADOS EN LA APP. Todos los archivos de audio
  #                          viajan en el bundle del cliente; el audio funciona
  #                          100% offline y no existe ruta de descarga.
  #   D1  Controles        : MUTE GLOBAL + volumen independiente para SFX y para
  #                          música, ubicados en Ajustes (C4).
  #   D2  Eventos SFX      : Outcomes del motor (advanced / blocked / exited)
  #                          + transiciones terminales (WON / LOST). Los sonidos
  #                          de interacción de UI (botones/menús) quedan FUERA
  #                          del alcance de v1.
  #   D3  Música           : POOL PEQUEÑO POR DIFICULTAD. Se empaquetan pocas
  #                          pistas (~1 por dificultad: easy/medium/hard) y cada
  #                          nivel reproduce en loop la pista de su dificultad,
  #                          solo durante el gameplay (IN_PROGRESS). No hay
  #                          música en menús ni una pista por nivel (el bundle
  #                          no se sobrecarga).
  #   D4  Autoplay         : El audio solo puede iniciarse tras la primera
  #                          interacción del usuario (restricción móvil/navegador).
  #   D5  Licencia         : Todo asset de audio (SFX y música) debe ser libre de
  #                          copyright / royalty-free (p. ej. NEFFEX, NCS). La
  #                          atribución que exija la licencia se muestra en la
  #                          sección de créditos de Ajustes (C4).

  Background: un cliente con audio inicializado y preferencias cargadas
    Given los assets de audio están empaquetados dentro del bundle del cliente
    And las preferencias de audio del usuario fueron leídas al arrancar (mute, volumen SFX, volumen música)
    And el usuario ya realizó al menos una interacción, por lo que el contexto de audio está desbloqueado
    And la capa de presentación observa los outcomes de cada tick con el mismo patrón "caller" de B2

  Rule: El audio es una proyección de solo lectura — nunca afecta al dominio

    Scenario: Un fallo de reproducción no altera el resultado del tick
      Given el dominio resolvió un tick con outcome "advanced" para la flecha A
      When la reproducción del SFX correspondiente falla o se omite
      Then el estado del dominio permanece exactamente igual que si el sonido hubiera sonado
      And la animación de B2 y el render de B1 no se ven afectados
      And ningún error de audio se propaga al motor

    Scenario: Jugar con audio silenciado produce el mismo estado final
      Given la misma secuencia de ticks del dominio se aplica dos veces
      And en la primera ejecución el mute global está desactivado
      And en la segunda ejecución el mute global está activado
      When ambas ejecuciones terminan
      Then el estado final del dominio es idéntico en ambas
      And el score final (A5) es idéntico en ambas

    Scenario: El SFX nunca bloquea la ventana de animación del tick
      Given un tick está animándose según la ventana de B2
      When los SFX del tick se reproducen
      Then la ventana de animación abre y cierra en los mismos términos que sin audio
      And el siguiente tick no espera a que ningún sonido termine

  Rule: Los SFX se disparan por outcome del motor (D2)

    Scenario Outline: Cada outcome de tick dispara su efecto de sonido
      Given el dominio resolvió un tick con outcome "<outcome>" para una flecha
      When la capa de presentación consume ese outcome
      Then se reproduce el SFX asociado a "<outcome>"
      And el sonido se reproduce al volumen de SFX configurado

      Examples:
        | outcome  |
        | advanced |
        | blocked  |
        | exited   |

    Scenario: Varios outcomes en el mismo tick no saturan la salida
      Given un tick donde M flechas obtienen outcomes simultáneos
      When los SFX del tick se reproducen
      Then la reproducción no distorsiona ni encola sonidos más allá del tick
      And a lo sumo se percibe una emisión por tipo de outcome dentro del mismo tick

    Scenario: La transición a WON reproduce el sonido de victoria
      Given una partida con estado IN_PROGRESS
      When la GameSession transiciona a WON (C1)
      Then se reproduce el SFX de victoria una única vez
      And la música de fondo se detiene

    Scenario: La transición a LOST reproduce el sonido de derrota
      Given una partida con estado IN_PROGRESS
      When la GameSession transiciona a LOST (C1)
      Then se reproduce el SFX de derrota una única vez
      And la música de fondo se detiene

    Scenario: Las interacciones de UI no emiten sonido (fuera de alcance v1)
      Given el jugador navega por menús y overlays de C4
      When pulsa botones o cambia de pantalla
      Then no se reproduce ningún SFX de interfaz

  Rule: La música suena en loop solo durante el gameplay, según la dificultad del nivel (D3)

    Scenario: La música arranca al entrar en una partida
      Given el jugador inicia o reinicia un nivel
      When la partida queda en estado IN_PROGRESS
      Then la pista de música de fondo comienza a reproducirse en loop
      And se reproduce al volumen de música configurado

    Scenario Outline: La pista se selecciona por la dificultad del nivel
      Given un nivel cuya metadata declara "difficulty": "<difficulty>" (contrato de C2/F2)
      When la partida queda en estado IN_PROGRESS
      Then se reproduce en loop la pista del pool asignada a la dificultad "<difficulty>"
      And dos niveles con la misma dificultad reproducen la misma pista

      Examples:
        | difficulty |
        | easy       |
        | medium     |
        | hard       |

    Scenario: Una dificultad sin pista asignada usa la pista por defecto del pool
      Given un nivel cuya dificultad no tiene pista asignada en el pool
      When la partida queda en estado IN_PROGRESS
      Then se reproduce la pista por defecto del pool
      And la ausencia de pista específica no genera errores ni silencio inesperado

    Scenario: La música se pausa cuando la partida se pausa
      Given una partida IN_PROGRESS con música sonando
      When el flujo de UI entra en PAUSED (C4)
      Then la música se pausa sin reiniciar su posición
      And al reanudar la partida la música continúa desde donde quedó

    Scenario: No hay música fuera del gameplay
      Given el jugador está en la pantalla de Inicio, Ajustes o selección de niveles
      Then la música de fondo no se reproduce
      And ninguna pista queda sonando tras salir de una partida

  Rule: Controles de audio en Ajustes — mute global y volúmenes independientes (D1)

    Scenario: El mute global silencia SFX y música sin borrar los volúmenes
      Given el volumen de SFX es 80 y el de música es 50
      When el jugador activa el mute global en Ajustes
      Then ni los SFX ni la música emiten sonido
      And los valores 80 y 50 se conservan
      And al desactivar el mute se restauran esos mismos volúmenes

    Scenario: El volumen de SFX no afecta a la música (y viceversa)
      Given música sonando y SFX activos
      When el jugador baja el volumen de SFX a 0
      Then los SFX dejan de percibirse
      And la música continúa a su volumen configurado sin cambios

    Scenario: Los cambios de audio aplican en caliente
      Given una partida IN_PROGRESS con música sonando
      When el jugador cambia el volumen de música desde Ajustes
      Then el nuevo volumen se aplica de inmediato sin reiniciar la pista ni la partida

    Scenario: Las preferencias de audio persisten entre arranques
      Given el jugador configuró mute desactivado, SFX 80 y música 50
      When cierra y vuelve a abrir la aplicación
      Then las preferencias cargadas son mute desactivado, SFX 80 y música 50
      And se aplican antes de reproducir cualquier sonido

  Rule: Todos los assets de audio son libres de copyright y con atribución visible (D5)

    Scenario: El pool de audio solo contiene assets royalty-free
      Given el bundle del cliente empaqueta pistas de música y SFX
      Then cada asset proviene de una fuente libre de copyright / royalty-free (p. ej. NEFFEX, NCS)
      And ningún asset con licencia restrictiva forma parte del bundle

    Scenario: La atribución exigida por la licencia es visible en Ajustes
      Given una pista del pool cuya licencia exige atribución al autor
      When el jugador abre la sección de créditos en Ajustes (C4)
      Then se muestra la atribución de cada pista y efecto empaquetado (autor y fuente)

  Rule: Restricción de autoplay — el audio espera la primera interacción (D4)

    Scenario: Ningún sonido se emite antes de la primera interacción del usuario
      Given la aplicación acaba de cargar y el usuario aún no ha tocado la pantalla
      Then no se reproduce música ni SFX alguno
      And el intento de reproducción no genera errores visibles

    Scenario: El audio se desbloquea con la primera interacción
      Given la aplicación cargó sin que el contexto de audio esté desbloqueado
      When el usuario realiza su primera interacción (tap/click)
      Then el contexto de audio queda habilitado
      And a partir de ese momento los SFX y la música se reproducen con normalidad
