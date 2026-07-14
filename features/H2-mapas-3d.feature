# H2 — Mapas 3D
#
# Un nivel 3D es un conjunto de capas XY indexadas por Z (layer).
# Las celdas 3D tienen portCount: 6 (ports 0-3 planar + port 4 forward/Z+ + port 5 back/Z-).
# El dominio no cambia: Cell ya acepta cualquier portCount par.
# Los cambios son exclusivamente en el contrato de datos (DTOs) y en la capa de presentación.
#
# Convención de puertos (extendida):
#   0=N  1=E  2=S  3=O  4=Forward(Z+)  5=Back(Z-)

Feature: H2 — Mapas 3D con navegación por capas Z

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 1 — Contrato de datos (DTOs y Scene)
  # ─────────────────────────────────────────────────────────────────

  Scenario: Serializar un nivel 3D incluye layer y mapMode en el DTO
    Given una Scene con mapMode '3d' y celdas en capas 0, 1 y 2
    When se llama toLevelDataDTO(scene)
    Then el DTO resultante tiene mapMode: '3d'
    And cada celda del DTO tiene el campo layer con su valor correcto
    And las celdas con layer 0 pueden omitir el campo layer (retrocompat)

  Scenario: Deserializar un nivel 3D desde DTO produce SceneCells con layer
    Given un LevelDataDTO con mapMode '3d' y celdas con campo layer
    When se llama sceneFromLevelData(dto)
    Then cada SceneCell tiene el campo layer correspondiente al DTO
    And las celdas sin campo layer en el DTO reciben layer: 0 por defecto

  Scenario: Deserializar un nivel 2D existente no rompe la retrocompatibilidad
    Given un LevelDataDTO sin campo mapMode ni layer (nivel 2D clásico)
    When se llama sceneFromLevelData(dto)
    Then todas las SceneCells tienen layer: 0
    And la Scene resultante no tiene mapMode o lo tiene como '2d'
    And el nivel carga y juega sin errores

  Scenario: Celda 3D con portCount 6 es aceptada por el dominio sin cambios
    Given una SceneCell con portCount: 6 y layer: 1
    When se construye un Board con esa celda via BuildBoardUseCase
    Then la celda tiene 6 puertos indexados 0..5
    And no se lanza ningún error de topología

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 2 — portDelta extendido para ports 4 y 5
  # ─────────────────────────────────────────────────────────────────

  Scenario: portDelta retorna delta válido para port 4 (forward/Z+)
    When se llama portDelta(4)
    Then retorna { dCol: -0.5, dRow: -0.5 }
    And no lanza RangeError

  Scenario: portDelta retorna delta válido para port 5 (back/Z-)
    When se llama portDelta(5)
    Then retorna { dCol: 0.5, dRow: 0.5 }
    And no lanza RangeError

  Scenario: portDelta lanza RangeError para port 6 o mayor
    When se llama portDelta(6)
    Then lanza RangeError con mensaje sobre índice fuera de rango

  Scenario: isInterLayerPort identifica correctamente ports 4 y 5
    When se llama isInterLayerPort(4)
    Then retorna true
    When se llama isInterLayerPort(5)
    Then retorna true
    When se llama isInterLayerPort(3)
    Then retorna false

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 3 — sceneOps: addCell y rotateHead 3D
  # ─────────────────────────────────────────────────────────────────

  Scenario: addCell con layer y portCount crea una SceneCell 3D
    Given una Scene vacía
    When se llama addCell(scene, 2, 3, layer=1, portCount=6)
    Then la Scene resultante tiene una celda con id '2,3', layer 1 y portCount 6

  Scenario: addCell sin layer ni portCount crea una SceneCell 2D (retrocompat)
    Given una Scene vacía
    When se llama addCell(scene, 0, 0)
    Then la Scene resultante tiene una celda con id '0,0', layer 0 y portCount 4

  Scenario: rotateHead en una celda de 6 puertos cicla por todos los puertos
    Given una Scene con una flecha cuya cabeza está en una celda portCount: 6 en exitPort: 3
    When se llama rotateHead(scene, arrowId) tres veces consecutivas
    Then el exitPort evoluciona: 3 → 4 → 5 → 0

  Scenario: rotateHead en una celda de 4 puertos mantiene el ciclo de 4
    Given una Scene con una flecha cuya cabeza está en una celda portCount: 4 en exitPort: 3
    When se llama rotateHead(scene, arrowId)
    Then el exitPort es 0 (módulo 4)

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 4 — Forge: filtrado por capa activa
  # ─────────────────────────────────────────────────────────────────

  Scenario: ForgeCanvas solo muestra celdas de la capa activa
    Given una Scene 3D con celdas en layer 0 y layer 1
    And el activeLayer del Forge es 0
    When se renderiza el ForgeCanvas
    Then solo las celdas con layer 0 son visibles en el canvas
    And las celdas con layer 1 no aparecen

  Scenario: Cambiar la capa activa muestra las celdas de esa capa
    Given una Scene 3D con celdas en layer 0 y layer 1
    And el activeLayer del Forge es 0
    When se cambia activeLayer a 1
    Then las celdas con layer 1 son visibles
    And las celdas con layer 0 desaparecen

  Scenario: ForgeApp muestra barra de navegación de capas solo en modo 3D
    Given una Scene con mapMode: '3d'
    When se renderiza ForgeApp
    Then se muestra la barra de capas Z con el indicador 'Capa Z: 0 / N'
    And los botones de capa anterior/siguiente están presentes

  Scenario: ForgeApp no muestra barra de navegación en modo 2D
    Given una Scene con mapMode: '2d' (o sin mapMode)
    When se renderiza ForgeApp
    Then la barra de capas Z no está presente

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 5 — Forge: visualización de conexiones inter-capa
  # ─────────────────────────────────────────────────────────────────

  Scenario: Conexión entre ports 4/5 se visualiza como línea punteada en el Forge
    Given una Scene 3D con celda A (layer 0, port 4) conectada a celda B (layer 1, port 5)
    And el activeLayer es 0 (mostrando la celda A)
    When se renderiza el ForgeCanvas en modo connect o default
    Then la conexión desde el port 4 de la celda A se muestra como línea punteada
    And el ícono ▲ aparece en el puerto 4 del tile de la celda A

  Scenario: Ports 4 y 5 se dibujan como handles en las esquinas del tile en modo connect
    Given una Scene 3D con una celda de portCount 6 en la capa activa
    And el tool mode es 'connect'
    When se renderiza el ForgeCanvas
    Then se muestran 6 handles de puerto: 4 en los bordes (N/E/S/O) y 2 en las esquinas (▲/▼)

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 6 — Juego: navegación entre capas Z
  # ─────────────────────────────────────────────────────────────────

  Scenario: GameView muestra controles de capas Z solo en niveles 3D
    Given una Scene con mapMode: '3d' y 3 capas
    When se monta el GameView
    Then se muestra la barra de navegación 'Capa 1 / 3'
    And los botones ◀ y ▶ están presentes

  Scenario: GameView no muestra controles de capas en niveles 2D
    Given una Scene sin mapMode (nivel 2D clásico)
    When se monta el GameView
    Then no hay barra de navegación de capas

  Scenario: El jugador navega a la siguiente capa en el juego
    Given un GameView con nivel 3D en capa Z=0
    When el jugador presiona el botón ▶ (siguiente capa)
    Then se muestra la capa Z=1
    And el indicador muestra 'Capa 2 / N'

  Scenario: El botón de capa anterior está deshabilitado en la capa 0
    Given un GameView en la capa Z=0
    Then el botón ◀ (capa anterior) está deshabilitado

  Scenario: El botón de capa siguiente está deshabilitado en la última capa
    Given un GameView en la última capa disponible
    Then el botón ▶ (capa siguiente) está deshabilitado

  Scenario: Las flechas se muestran solo en la capa de su cabeza actual
    Given un nivel 3D con una flecha cuya cabeza está en la celda '2,2' (layer 1)
    And el jugador está viendo la capa Z=1
    Then la flecha es visible en el tablero
    When el jugador cambia a la capa Z=0
    Then la flecha no es visible en el tablero

  # ─────────────────────────────────────────────────────────────────
  # BLOQUE 7 — LevelPropertiesPanel: campo mapMode
  # ─────────────────────────────────────────────────────────────────

  Scenario: El panel de propiedades muestra selector de modo 2D/3D
    Given el ForgeApp renderizado
    When se abre el LevelPropertiesPanel
    Then hay un selector con opciones '2D' y '3D'

  Scenario: Cambiar a modo 3D actualiza la Scene y habilita la barra de capas
    Given una Scene con mapMode: '2d'
    When se selecciona '3D' en el LevelPropertiesPanel
    Then scene.mapMode cambia a '3d'
    And la barra de capas Z aparece en el ForgeApp
