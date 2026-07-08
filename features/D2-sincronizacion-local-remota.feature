Feature: Sincronización bidireccional del progreso con el servidor remoto
  Como motor del juego (cliente móvil offline-first)
  Quiero sincronizar la base de datos SQLite local con la API REST cuando haya conexión
  Para garantizar que mis récords estén respaldados en la nube y consistentes en múltiples dispositivos

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  # Upstream   : Carga de datos (Local → Servidor). Envía registros con `pendingSync = true`.
  # Downstream : Descarga de datos (Servidor → Local). Actualiza SQLite con récords remotos superiores.
  # Resolución : El servidor y el cliente usan el mismo criterio (score > moves > time > achievedAt).
  # ─────────────────────────────────────────────

  Background: precondiciones de red y sesión
    Given que el dispositivo móvil detecta una conexión a internet activa
    And el jugador posee un "Session Token" (JWT) válido en el almacenamiento del cliente

  # ══════════════════════════════════════════════
  # BLOQUE 1 — UPSTREAM: ENVÍO DE RÉCORDS LOCALES PENDIENTES
  # ══════════════════════════════════════════════

  Scenario: envío exitoso de progresos locales pendientes al servidor
    Given existen registros en SQLite donde la columna "pendingSync" es verdadera (true)
    When el motor de sincronización ejecuta la tarea de "Upstream"
    Then el cliente extrae estos registros y realiza las peticiones POST a "/api/progress"
    And al recibir un código HTTP 200 (OK) del servidor para un registro específico
    And el cliente actualiza ese registro en SQLite cambiando "pendingSync" a falso (false)

  Scenario: retención del estado pendiente ante un fallo de red o del servidor
    Given existen registros locales con "pendingSync" en verdadero (true)
    When el cliente intenta enviar los datos pero la petición falla (ej. timeout, error 500, sin red)
    Then la API lanza una excepción de red
    And la columna "pendingSync" se mantiene en verdadero (true) en SQLite
    And el proceso de sincronización se pausa para reintentarse en el futuro

  # ══════════════════════════════════════════════
  # BLOQUE 2 — DOWNSTREAM: DESCARGA Y ACTUALIZACIÓN DESDE EL SERVIDOR
  # ══════════════════════════════════════════════

  Scenario: descarga de récords remotos que no existen en el dispositivo local (restauración)
    Given un nivel "level_02" completado en otro dispositivo, guardado en el servidor
    And no existe un registro para "level_02" en la base de datos SQLite local
    When el motor ejecuta la tarea de "Downstream" haciendo GET a "/api/progress"
    Then el cliente recibe el `LevelProgress` remoto para "level_02"
    And lo inserta como un nuevo `LocalRecord` en SQLite
    And establece "pendingSync" en falso (false) para este nuevo registro

  Scenario: el récord remoto es superior al récord local actual
    Given un registro local para "level_01" con un "score" de 1000
    And el servidor reporta un progreso para "level_01" con un "score" de 2000
    When el motor ejecuta la tarea de "Downstream" y compara ambos récords
    Then el cliente detecta que el registro remoto supera al local (según la cascada de desempate)
    And sobrescribe el registro en SQLite con los datos remotos
    And asegura que "pendingSync" quede en falso (false)

  Scenario: el récord local es superior o igual al récord remoto (preservación)
    Given un registro local para "level_01" con un "score" de 2500
    And el servidor reporta un progreso para "level_01" con un "score" de 1000
    When el motor ejecuta la tarea de "Downstream" y compara ambos récords
    Then el cliente detecta que el registro local es superior
    And NO sobrescribe la base de datos SQLite con el dato remoto
    # Nota: Si el récord local es superior, es porque tiene pendingSync=true y se actualizará en el servidor durante el Upstream.

  # ══════════════════════════════════════════════
  # BLOQUE 3 — MANEJO DE SESIÓN Y AUTENTICACIÓN
  # ══════════════════════════════════════════════

  Scenario: interrupción de la sincronización por expiración del token
    Given el cliente inicia el proceso de sincronización
    When realiza una petición (GET o POST) a la API y recibe un código HTTP 401 (Unauthorized)
    Then el cliente aborta inmediatamente la cola de sincronización
    And preserva el estado actual de los registros en SQLite (sin alterar los "pendingSync")
    And notifica al sistema central para que inicie el flujo de re-autenticación del usuario

  # ══════════════════════════════════════════════
  # BLOQUE 4 — FLUJO DE ORQUESTACIÓN
  # ══════════════════════════════════════════════

  Scenario: ejecución de sincronización completa al abrir la aplicación
    When el jugador abre la aplicación y se detecta conexión a internet
    Then el motor de sincronización ejecuta el proceso completo en el siguiente orden:
    And 1. Ejecuta "Upstream" para empujar cualquier récord local jugado offline hacia el servidor.
    And 2. Ejecuta "Downstream" para traer cualquier progreso logrado en otros dispositivos.
    And este proceso ocurre en segundo plano sin bloquear la interfaz de usuario.