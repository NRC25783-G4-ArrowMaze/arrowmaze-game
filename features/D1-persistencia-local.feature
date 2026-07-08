Feature: Persistencia local del progreso y puntuaciones del jugador en SQLite
  Como motor del juego (cliente móvil)
  Quiero almacenar el progreso, puntuaciones y métricas en una base de datos local SQLite
  Para mantener los récords y el estado de avance del usuario de forma persistente en su dispositivo

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  # LocalRecord : Entidad en SQLite que guarda el progreso (levelId, score, movesUsed, timeElapsedSeconds, achievedAt, pendingSync).
  # High Score  : El récord local obedece la cascada de desempate (score > moves > time > achievedAt).
  # pendingSync : Bandera interna booleana para saber qué registros deben enviarse a la API REST.
  # ─────────────────────────────────────────────

  Background: inicialización de la base de datos local
    Given que el cliente tiene acceso a una base de datos SQLite local configurada y lista
    And existe una tabla "level_progress" con una clave primaria sobre el campo "levelId"

  # ══════════════════════════════════════════════
  # BLOQUE 1 — GUARDADO INICIAL DE PROGRESO
  # ══════════════════════════════════════════════

  Scenario: registro de progreso tras superar un nivel por primera vez
    Given que el jugador acaba de completar el nivel "level_01"
    And no existe un registro previo para "level_01" en la tabla "level_progress"
    When el motor del juego solicita guardar el resultado (score: 1500, movesUsed: 12, timeElapsedSeconds: 45)
    Then se inserta un nuevo registro en SQLite con esos datos y la fecha actual ("achievedAt")
    And la columna interna "pendingSync" se marca como verdadera (true)

  # ══════════════════════════════════════════════
  # BLOQUE 2 — ACTUALIZACIÓN DEL RÉCORD LOCAL (HIGH SCORE)
  # ══════════════════════════════════════════════

  Scenario: actualización exitosa del récord local al superar el puntaje principal
    Given un registro local para "level_01" con un "score" de 1000 y "pendingSync" en false
    When el jugador completa "level_01" nuevamente obteniendo un "score" de 2000
    Then el sistema detecta que el nuevo puntaje es superior al récord local
    And actualiza el registro en SQLite sobrescribiendo los datos (score, movimientos, tiempo y achievedAt)
    And la columna interna "pendingSync" cambia nuevamente a verdadera (true)

  Scenario: actualización por criterio de desempate (menos movimientos)
    Given un registro local para "level_01" con "score": 2000 y "movesUsed": 15
    When el jugador completa "level_01" obteniendo "score": 2000 y "movesUsed": 12
    Then el sistema detecta un empate en "score" pero una mejora en la cantidad de "movesUsed"
    And actualiza el registro en SQLite reflejando la mejora y la nueva fecha "achievedAt"
    And marca el registro con "pendingSync" en verdadero (true)

  Scenario: actualización por criterio de desempate (menor tiempo)
    Given un registro local para "level_01" con "score": 2000, "movesUsed": 12 y "timeElapsedSeconds": 60
    When el jugador completa "level_01" obteniendo "score": 2000, "movesUsed": 12 y "timeElapsedSeconds": 45
    Then el sistema detecta un empate en "score" y "movesUsed", pero una mejora en "timeElapsedSeconds"
    And actualiza el registro en SQLite reflejando el menor tiempo y la nueva fecha "achievedAt"
    And marca el registro con "pendingSync" en verdadero (true)

  Scenario: intento de guardado con rendimiento inferior o exactamente igual al récord local
    Given un registro local para "level_01" con "score": 2500, "movesUsed": 10, "timeElapsedSeconds": 30
    When el jugador completa "level_01" con un resultado inferior (ej. "score": 1200) o un empate total en estadísticas
    Then el sistema compara los resultados y determina que no hay una mejora sobre el récord histórico local
    And la base de datos SQLite no sufre ninguna modificación de métricas
    And el estado previo de la bandera "pendingSync" se conserva inalterado

  # ══════════════════════════════════════════════
  # BLOQUE 3 — CONSULTA PARA LA INTERFAZ DE USUARIO (UI)
  # ══════════════════════════════════════════════

  Scenario: recuperar el progreso de todos los niveles para la pantalla de selección
    When la pantalla de selección de niveles solicita el estado del progreso local
    Then SQLite ejecuta una consulta de lectura sobre la tabla "level_progress"
    And el sistema retorna un array con todos los objetos `LocalRecord` almacenados
    And la UI utiliza estos datos para mostrar estrellas, puntajes máximos y desbloquear el acceso a niveles subsecuentes

  Scenario: consultar progreso de un nivel específico que no ha sido jugado
    When el sistema consulta el progreso local específicamente para el nivel "level_99"
    And no existe ninguna fila asociada a "level_99" en SQLite
    Then el repositorio local devuelve un valor nulo
    And la UI interpreta esto renderizando el nivel en estado "no completado"