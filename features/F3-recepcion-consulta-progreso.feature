Feature: API REST de Recepción y Consulta del Progreso del Jugador
  Como aplicación cliente (motor del juego)
  Quiero enviar y consultar el progreso del jugador autenticado
  Para mantener sincronizados los logros, puntuaciones y niveles completados entre el dispositivo y el servidor

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  # LevelProgress : DTO que representa el rendimiento del jugador en un nivel superado.
  # Payload       : Datos enviados por el cliente (levelId, score, movesUsed, timeElapsedSeconds).
  # High Score    : El sistema debe conservar siempre el mejor intento del jugador, no el más reciente.
  # Aislamiento   : Un usuario solo puede acceder y modificar su propio progreso (basado en el token JWT).
  # ─────────────────────────────────────────────

  Background: configuración base y seguridad
    Given que la API acepta y responde estrictamente con "application/json"
    And las rutas operan bajo el prefijo "/api/progress"
    And todas las operaciones requieren un "Session Token" válido en la cabecera "Authorization: Bearer"
    And el sistema identifica al jugador usando el "userId" extraído del payload del token

  # ══════════════════════════════════════════════
  # BLOQUE 1 — GUARDADO Y ACTUALIZACIÓN DE PROGRESO (POST)
  # ══════════════════════════════════════════════

  Scenario: registro de progreso exitoso en un nivel no jugado previamente
    Given un jugador autenticado
    When realizo una petición POST a "/api/progress" con el payload:
      """
      {
        "levelId": "level_01",
        "score": 1500,
        "movesUsed": 12,
        "timeElapsedSeconds": 45
      }
      """
    Then el sistema valida que el "levelId" existe en el catálogo de niveles
    And el sistema crea un nuevo registro de progreso asociado al "userId"
    And la API responde con código HTTP 200 (OK)
    And la respuesta confirma "Progreso guardado correctamente"

  Scenario: actualización de progreso superando la puntuación anterior (High Score)
    Given un jugador que ya completó "level_01" con un "score" de 1000 y 15 "movesUsed"
    When realizo una petición POST a "/api/progress" para "level_01" con un "score" de 2000 y 10 "movesUsed"
    Then el sistema detecta que el nuevo puntaje es superior al registro histórico
    And el sistema sobrescribe los datos de "score", "movesUsed" y "timeElapsedSeconds" con los nuevos valores
    And la API responde con código HTTP 200 (OK) indicando "Nuevo récord guardado"

  Scenario: intento de guardado con una puntuación inferior a la histórica
    Given un jugador que ya completó "level_01" con un "score" de 2500
    When realizo una petición POST a "/api/progress" para "level_01" con un "score" de 1200
    Then el sistema procesa la petición pero NO sobrescribe el récord histórico en la base de datos
    And la API responde con código HTTP 200 (OK) indicando "Progreso registrado (no supera el récord actual)"

  # ══════════════════════════════════════════════
  # BLOQUE 2 — CONSULTA DE PROGRESO (GET)
  # ══════════════════════════════════════════════

  Scenario: recuperar el progreso general de todos los niveles jugados
    Given un jugador autenticado que ha completado múltiples niveles
    When realizo una petición GET a "/api/progress"
    Then la API responde con código HTTP 200 (OK)
    And el cuerpo de la respuesta es un array de objetos `LevelProgress` pertenecientes EXCLUSIVAMENTE a ese "userId"
    And el cliente puede usar esta información para desbloquear niveles en el menú del juego

  Scenario: recuperar el progreso de un nivel específico
    Given un jugador autenticado
    When realizo una petición GET a "/api/progress/level_01"
    Then la API responde con código HTTP 200 (OK)
    And el cuerpo de la respuesta contiene el objeto `LevelProgress` de ese nivel
    
  Scenario: consulta de un nivel que el jugador aún no ha intentado
    Given un jugador autenticado
    When realizo una petición GET a "/api/progress/level_99" (nivel no jugado)
    Then la API responde con código HTTP 404 (Not Found)

  # ══════════════════════════════════════════════
  # BLOQUE 3 — AISLAMIENTO Y SEGURIDAD
  # ══════════════════════════════════════════════

  Scenario: rechazo por falta de autenticación
    When realizo una petición GET o POST a "/api/progress" sin la cabecera "Authorization"
    Then el middleware de seguridad intercepta la petición
    And la API responde con código HTTP 401 (Unauthorized)

  Scenario: el jugador no puede alterar el progreso de otra cuenta (Aislamiento de inquilino)
    Given un jugador A autenticado
    When realizo una petición POST a "/api/progress" intentando inyectar un "userId" correspondiente al jugador B en el payload
    Then el sistema ignora el "userId" del payload y utiliza ESTRICTAMENTE el "userId" decodificado de su propio JWT
    And el progreso se guarda en la cuenta del jugador A, protegiendo los datos del jugador B

  # ══════════════════════════════════════════════
  # BLOQUE 4 — VALIDACIÓN DE INTEGRIDAD DEL DTO
  # ══════════════════════════════════════════════

  Scenario: rechazo de guardado por datos ilógicos o corruptos
    Given un jugador autenticado
    When realizo una petición POST a "/api/progress" con un payload que contiene "movesUsed": -5
    Then la API responde con código HTTP 400 (Bad Request)
    And la respuesta detalla el error: "ProgressValidationError: movesUsed must be a positive integer"

  Scenario: rechazo por hacer referencia a un nivel inexistente
    Given un jugador autenticado
    When realizo una petición POST a "/api/progress" con un "levelId" que no existe en el catálogo de la base de datos
    Then la API responde con código HTTP 422 (Unprocessable Entity)
    And la respuesta detalla el error: "LevelRegistryError: el nivel especificado no existe"