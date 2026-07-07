# C3-seleccion-niveles-progreso.feature

Feature: Selección de niveles — mapa de progreso con desbloqueo por grafo
  Como jugador en un cliente web/Android
  Quiero un mapa de niveles que muestre mi progreso y qué niveles tengo desbloqueados
  Para elegir a qué nivel entrar y percibir mi avance como un recorrido

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # LevelMetadata      : Resumen del nivel (id, name, difficulty, allowedMoves),
  #                      mismo contrato que F2/C2. Con esto se arma el listado;
  #                      NO se descarga el `LevelData` completo hasta entrar.
  # LevelMap           : Estructura de catálogo que declara la topología del mapa:
  #                      por nodo, su `levelId`, sus `prerequisites` (aristas), una
  #                      pista de disposición `pathHint` y sus `starThresholds`
  #                      opcionales. Es ADITIVA: no altera los campos fijos por
  #                      nivel de `LevelData`/`LevelMetadata` (F2/C2).
  # IProgressRepository: Puerto de LECTURA del progreso local (D1). Devuelve
  #                      registros `PlayerProgress` { levelId, status, bestScore }.
  #                      C3 SOLO lee; nunca escribe progreso.
  # Estado de nodo     : DERIVADO en presentación → `bloqueado` | `disponible` |
  #                      `completado`. `actual` (focal) es un énfasis visual sobre
  #                      un nodo `disponible`, no un 4º estado persistido.
  # ─────────────────────────────────────────────
  #
  # INVARIANTE CENTRAL
  #
  # C3 es una PROYECCIÓN de PRESENTACIÓN de solo lectura: combina el catálogo de
  # niveles con el progreso local para derivar el estado de cada nodo. No dispara
  # ticks, no consume movimientos, no toca el Dominio (A1–A5) y no escribe
  # progreso. El desbloqueo se DERIVA del grafo de prerequisitos + los niveles
  # `completado`; el grafo es la fuente autoritativa (si D1 cachea un flag de
  # desbloqueo, es una denormalización que debe coincidir con esta derivación).
  # El `LevelMap` se asume acíclico (DAG); un ciclo dejaría nodos bloqueados para
  # siempre y es responsabilidad del autor del catálogo evitarlo.
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-05)
  #   D1  Desbloqueo    : Por GRAFO de prerequisitos (DAG). Un nodo pasa a
  #                       `disponible` cuando TODOS sus prerequisitos están
  #                       `completado` (AND). Los nodos raíz (sin prerequisitos)
  #                       están SIEMPRE disponibles, incluso sin progreso/offline.
  #                       Subsume la progresión lineal (cadena) y la ramificada.
  #   D2  Completado    : Basta con haber GANADO (WON) el nivel una vez (existe
  #                       `bestScore`, A5). No hay umbral mínimo de score/estrellas
  #                       para desbloquear. `completado` es monótono (no revierte).
  #   D3  Nodo focal    : `actual` = el primer nodo `disponible` sin completar en
  #                       el orden del `LevelMap`. Único punto focal de la pantalla.
  #   D4  Métricas      : El nodo `completado` muestra `bestScore` (A5, siempre
  #                       presente en WON) + check. Estrellas 1–3 OPCIONALES, con
  #                       `starThresholds` [twoStar, threeStar] AUTORADOS en el
  #                       `LevelMap` (aditivo): 1★ por superar el nivel, 2★ al
  #                       alcanzar el primer umbral, 3★ al alcanzar el segundo. Sin
  #                       umbrales definidos: solo score numérico + check.
  #   D5  Toque bloqueado: No navega ni descarga `LevelData`; muestra un aviso
  #                       breve (clave i18n) + iconografía de candado.
  #   D6  Offline-first : La pantalla se arma del catálogo local + progreso local.
  #                       El refresco remoto del catálogo (F2) es complementario y
  #                       NUNCA bloquea el render.
  #   D7  Presentación  : Textos de UI vía catálogo i18n (G2); el `name` del nivel
  #                       se muestra tal cual (P24). C3 no muta Dominio ni progreso.
  #
  # SUB-DECISIONES CERRADAS (elicitación SDD 2026-07-05)
  #   - `starThresholds`: AUTORADOS por nivel en el `LevelMap`/catálogo, de forma
  #     ADITIVA (no cambian el contrato fijo `LevelData`/`LevelMetadata` de F2/C2).
  #     Curva de DOS UMBRALES ABSOLUTOS [twoStar, threeStar] ascendentes: 1★ por
  #     superar el nivel, 2★ al alcanzar el primero, 3★ al alcanzar el segundo. Si
  #     un nivel no los define, su nodo muestra solo score numérico + check.
  #   - Uniones del grafo: se CONFIRMA AND (todos los prerequisitos). OR queda como
  #     posible variante futura, fuera del alcance de esta spec.

  Background: catálogo local y progreso local disponibles
    Given un catálogo local con este `LevelMap` de nodos y prerequisitos:
      | levelId | prerequisites |
      | L1      |               |
      | L2      | L1            |
      | L3      | L1            |
      | L4      | L2, L3        |
      | L5      | L4            |
    And cada nodo referencia un `LevelMetadata` (id, name, difficulty, allowedMoves)
    And el progreso local se lee del puerto `IProgressRepository` (D1)
    And la pantalla se arma sin descargar ningún `LevelData` completo

  # ══════════════════════════════════════════════
  # DESBLOQUEO Y ESTADO DE NODO
  # ══════════════════════════════════════════════

  Rule: El estado de cada nodo se deriva del grafo de prerequisitos y del progreso (D1, D2)

    Scenario: Sin progreso, solo la raíz está disponible
      Given no existe ningún registro `PlayerProgress` (instalación nueva)
      When se renderiza el mapa de selección
      Then el nodo "L1" está `disponible`
      And los nodos "L2", "L3", "L4" y "L5" están `bloqueado`
      And ningún nodo está `completado`

    Scenario: Completar un nodo desbloquea sus sucesores directos (rama)
      Given el progreso marca "L1" como `completado`
      When se renderiza el mapa de selección
      Then "L1" está `completado`
      And "L2" y "L3" están `disponible`
      And "L4" y "L5" siguen `bloqueado`

    Scenario: Un nodo de unión requiere TODOS sus prerequisitos (AND)
      Given el progreso marca "L1" y "L2" como `completado`
      And "L3" no está `completado`
      When se renderiza el mapa de selección
      Then "L4" sigue `bloqueado`
      # L4 requiere L2 Y L3; falta L3

    Scenario: El nodo de unión se desbloquea al completar todos sus prerequisitos
      Given el progreso marca "L1", "L2" y "L3" como `completado`
      When se renderiza el mapa de selección
      Then "L4" pasa a `disponible`
      And "L5" sigue `bloqueado`

    Scenario: Un prerequisito inexistente en el catálogo mantiene el nodo bloqueado (a prueba de fallos)
      Given un nodo adicional "LX" cuyo prerequisito "L_GHOST" no existe en el catálogo
      When se renderiza el mapa de selección
      Then "LX" está `bloqueado`
      And el resto del mapa se renderiza sin error

    Scenario: Completar es monótono — volver a jugar con menor score no revierte el estado
      Given "L1" está `completado` con `bestScore` 3200
      When el jugador vuelve a jugar "L1" y gana con score 800
      Then "L1" permanece `completado`
      And su `bestScore` mostrado sigue siendo 3200
      # D1 conserva solo la mejor marca; C3 refleja esa invariante

  # ══════════════════════════════════════════════
  # NODO FOCAL (SIGUIENTE PASO LÓGICO)
  # ══════════════════════════════════════════════

  Rule: El nodo focal (`actual`) señala el siguiente paso lógico (D3)

    Scenario: El focal es el primer disponible sin completar
      Given no existe ningún registro `PlayerProgress`
      When se renderiza el mapa de selección
      Then "L1" es el nodo `actual` (focal)

    Scenario: Con varios nodos disponibles, solo uno es el focal
      Given el progreso marca "L1" como `completado`
      When se renderiza el mapa de selección
      Then "L2" y "L3" están `disponible`
      And el nodo `actual` (focal) es "L2"
      # Primer `disponible` sin completar según el orden del `LevelMap`

    Scenario: Con todos los niveles completados no hay nodo focal
      Given el progreso marca "L1", "L2", "L3", "L4" y "L5" como `completado`
      When se renderiza el mapa de selección
      Then ningún nodo se resalta como `actual`
      And todos los nodos se muestran `completado`

  # ══════════════════════════════════════════════
  # MÉTRICAS DE RENDIMIENTO EN NODOS COMPLETADOS
  # ══════════════════════════════════════════════

  Rule: Los nodos completados muestran sus métricas de rendimiento (D4)

    Scenario: Un nodo completado muestra su mejor score y un check
      Given "L1" está `completado` con `bestScore` 2500
      When se renderiza su nodo en el mapa
      Then el nodo muestra el `bestScore` 2500
      And muestra un indicador de nivel superado (check)

    Scenario Outline: Las estrellas se derivan de los `starThresholds` del nivel
      Given "L1" está `completado` con `bestScore` <score>
      And "L1" define `starThresholds` [2000, 3000]
      When se renderiza su nodo en el mapa
      Then el nodo muestra <estrellas> estrellas

      Examples:
        | score | estrellas |
        | 500   | 1         |
        | 1999  | 1         |
        | 2000  | 2         |
        | 2999  | 2         |
        | 3000  | 3         |
        | 5000  | 3         |

    Scenario: Sin `starThresholds` el nodo muestra solo el score numérico
      Given "L1" está `completado` con `bestScore` 1500
      And "L1" no define `starThresholds`
      When se renderiza su nodo en el mapa
      Then el nodo muestra el `bestScore` 1500 y el check
      And no muestra estrellas

    Scenario: Un nodo no jugado no muestra métricas de rendimiento
      Given "L2" está `disponible` y sin registro de progreso
      When se renderiza su nodo en el mapa
      Then el nodo no muestra score ni estrellas

  # ══════════════════════════════════════════════
  # INTERACCIÓN Y AFFORDANCE POR ESTADO
  # ══════════════════════════════════════════════

  Rule: La interacción con un nodo depende de su estado (D5)

    Scenario: Tocar un nodo disponible descarga su LevelData e inicia la partida
      Given "L2" está `disponible`
      When el jugador toca el nodo "L2"
      Then se solicita el `LevelData` completo de "L2" (carga C2)
      And la partida de "L2" inicia en estado IN_PROGRESS

    Scenario: Tocar un nodo completado permite volver a jugarlo
      Given "L1" está `completado` con `bestScore` 3200
      When el jugador toca el nodo "L1"
      Then se solicita el `LevelData` completo de "L1"
      And la partida inicia de nuevo
      And su `bestScore` de 3200 se conserva hasta ser superado

    Scenario: Tocar un nodo bloqueado no navega ni descarga nada
      Given "L4" está `bloqueado`
      When el jugador toca el nodo "L4"
      Then no se solicita ningún `LevelData`
      And la pantalla permanece en la selección de niveles
      And se muestra un aviso breve (clave i18n) indicando que faltan niveles previos

  # ══════════════════════════════════════════════
  # OFFLINE-FIRST Y REFRESCO REMOTO COMPLEMENTARIO
  # ══════════════════════════════════════════════

  Rule: La pantalla funciona offline; el refresco remoto es complementario (D6)

    Scenario: El mapa se arma sin red desde el catálogo y el progreso locales
      Given el dispositivo está sin conexión
      When se abre la pantalla de selección
      Then el mapa se arma a partir del catálogo local y el progreso local
      And no se requiere ninguna petición de red para renderizarlo

    Scenario: Un refresco remoto exitoso del catálogo actualiza el mapa
      Given la pantalla ya muestra el catálogo local
      When un refresco remoto (F2) devuelve un catálogo con un nodo nuevo "L6"
      Then el mapa incorpora "L6" con su estado derivado
      And el progreso local existente se conserva

    Scenario: Un refresco remoto fallido no bloquea la pantalla
      Given la pantalla ya muestra el catálogo local
      When un refresco remoto (F2) falla por error de red
      Then el mapa sigue mostrando el último catálogo local
      And no se muestra un estado de error bloqueante

    Scenario: El listado se arma solo con LevelMetadata (ahorro de ancho de banda)
      When se renderiza el mapa de selección
      Then cada nodo usa solo "id", "name", "difficulty" y "allowedMoves"
      And no se descargan "cells", "connections" ni "arrows" de ningún nivel

  # ══════════════════════════════════════════════
  # PRESENTACIÓN PURA, I18N Y DETERMINISMO
  # ══════════════════════════════════════════════

  Rule: C3 es presentación pura, internacionalizada y determinista (D7)

    Scenario: Abrir la selección de niveles no altera el dominio ni el progreso
      Given un progreso local con "L1" `completado`
      When el jugador abre y cierra la pantalla de selección
      Then ningún movimiento se consume y ningún score cambia
      And el puerto `IProgressRepository` no recibe escrituras

    Scenario: El mismo catálogo y el mismo progreso producen el mismo mapa
      Given un catálogo y un progreso local fijos
      When la pantalla se renderiza dos veces
      Then el estado derivado de cada nodo es idéntico
      And el nodo `actual` (focal) es el mismo en ambas

    Scenario: Los textos de la UI se traducen pero el nombre del nivel no (P24)
      Given un `LevelMetadata` con "name": "Nivel Inicial"
      And la UI está en inglés
      When se renderiza su nodo en el mapa
      Then las etiquetas de la interfaz aparecen en inglés (catálogo i18n, G2)
      And el nombre del nivel mostrado es exactamente "Nivel Inicial"

  # ══════════════════════════════════════════════
  # REPRESENTACIÓN VISUAL DEL GRAFO (DISEÑO DE MAPA)
  # ══════════════════════════════════════════════

  Rule: La representación visual comunica estado y topología (diseño de mapa)

    Scenario: Cada estado tiene una affordance visual distinta
      Given un mapa con "L1" `completado`, "L2" `disponible` como focal y "L4" `bloqueado`
      When se renderiza el mapa
      Then "L4" se muestra a menor escala y con iconografía de candado/cadenas
      And "L2" se muestra a mayor escala y resaltado (marco o pulso) como punto focal
      And "L1" muestra sus métricas anidadas (estrellas/check/score)

    Scenario: Las aristas entre nodos comunican si el recorrido es lineal o ramificado
      Given el `LevelMap` conecta "L1" con "L2" y "L1" con "L3"
      When se renderiza el mapa
      Then se dibujan aristas de "L1" hacia "L2" y hacia "L3"
      And la bifurcación es visible como dos caminos que parten de "L1"

    Scenario: Los nodos siguen un flujo espacial no recto
      Given cada nodo declara una pista de disposición `pathHint`
      When se renderiza el mapa
      Then los nodos se distribuyen a lo largo de un camino curvo/zigzag (no una fila recta)
      And ese `pathHint` es puramente visual: no altera el estado ni el desbloqueo de ningún nodo
