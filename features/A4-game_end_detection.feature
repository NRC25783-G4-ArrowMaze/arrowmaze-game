Feature: Detección de finalización de partida por vaciado del tablero o agotamiento de movimientos

Como motor de estado de partida
Quiero que la sesión de juego evalúe sus condiciones de cierre tras cada movimiento ejecutado
Para emitir un veredicto determinista de victoria, derrota o continuidad

# ─────────────────────────────────────────────
# CONCEPTOS CLAVE DEL DOMINIO (SRP ESTRICTO)
# GameSession : Aggregate root. Custodio del contador y del status. Desconoce la cinemática de las flechas.
# movesRemaining : Contador atómico del presupuesto de movimientos del nivel. Declarado en LevelData.allowedMoves.
# GameStatus : Veredicto de la partida. IN_PROGRESS | WON | LOST. Terminal una vez finalizado.
# consumeMove : Operación atómica que decrementa el presupuesto. Invariante: nunca < 0.
# evaluateStatus : Query que inspecciona el tablero pasivo y resuelve el veredicto vigente.
# Board emptiness : Predicado de victoria. Todas las celdas reportan hasArrowSegment() == false.
# PlayMoveUseCase : Orquestador. Delega cinemática a AdvanceArrowUseCase y luego coordina la sesión.
# ─────────────────────────────────────────────
# INVARIANTE DE EVALUACIÓN
# Por cada ejecución exitosa del orquestador (independiente del outcome cinemático):
# 1. movesRemaining decrementa en exactamente 1.
# 2. evaluateStatus inspecciona el tablero para resolver el veredicto.
# La victoria tiene precedencia estricta sobre la derrota: si el último movimiento vacía el tablero, WON.
# Un GameStatus distinto de IN_PROGRESS es terminal e irreversible.
# ─────────────────────────────────────────────

Background: Sesión de juego inicializada desde el nivel
Given un nivel cargado con allowedMoves = N declarado en LevelData
And un tablero pasivo construido a partir del mismo nivel
And una GameSession instanciada con movesRemaining = N y status = IN_PROGRESS
And un PlayMoveUseCase con dependencia sobre AdvanceArrowUseCase
And la regla de orquestación: cada ejecución exitosa del use case decrementa 1 movimiento y re-evalúa el status

# ══════════════════════════════════════════════
# BLOQUE 1 — CONSUMO ATÓMICO DEL PRESUPUESTO DE MOVIMIENTOS
# ══════════════════════════════════════════════

Scenario: Toda ejecución exitosa del orquestador decrementa exactamente 1 movimiento
Given una sesión con movesRemaining = 5 y status = IN_PROGRESS
And una Flecha con ruta válida o bloqueada
When el controlador emite el tick PlayMove
Then movesRemaining queda en 4

Scenario: Fallo de pre-condición del orquestador no consume movimiento
Given una sesión con movesRemaining = 7
And AdvanceArrowUseCase retorna success = false (input inválido)
When el controlador emite el tick PlayMove
Then GameSession.consumeMove() NO es invocado
And movesRemaining permanece en 7
And el status permanece IN_PROGRESS

# ══════════════════════════════════════════════
# BLOQUE 2 — DETECCIÓN DE VICTORIA POR VACIADO DEL TABLERO
# ══════════════════════════════════════════════

Scenario: La última flecha sale del tablero y emite veredicto WON
Given una sesión con movesRemaining = 4
And exactamente 1 Flecha sobre el tablero con cabeza apuntando a un puerto exit
When el controlador emite el tick PlayMove
Then AdvanceArrowUseCase reporta outcome = destroyed
And evaluateStatus(board) inspecciona todas las celdas del tablero
And todas las celdas reportan hasArrowSegment() == false
And GameStatus transiciona a WON
And movesRemaining queda en 3

Scenario: Vaciado del tablero exactamente al gastar el último movimiento (precedencia WON sobre LOST)
Given una sesión con movesRemaining = 1
And 1 Flecha cuyo próximo tick la conduce al sumidero
When el controlador emite el tick PlayMove
Then movesRemaining decrementa a 0
And el tablero queda completamente vacío
And evaluateStatus aplica la regla de precedencia: victoria gana sobre derrota
And GameStatus transiciona a WON (no a LOST)

Scenario: Múltiples flechas, evacuación parcial mantiene partida en curso
Given una sesión con movesRemaining = 8
And 3 Flechas activas sobre el tablero
When el controlador emite 1 tick PlayMove que destruye exactamente 1 flecha
Then evaluateStatus detecta que 2 flechas aún ocupan celdas
And GameStatus permanece IN_PROGRESS
And movesRemaining queda en 7

# ══════════════════════════════════════════════
# BLOQUE 3 — DETECCIÓN DE DERROTA POR AGOTAMIENTO DEL PRESUPUESTO
# ══════════════════════════════════════════════

Scenario: movesRemaining alcanza 0 con tablero aún ocupado emite LOST
Given una sesión con movesRemaining = 1
And al menos 1 Flecha que NO completará su evacuación con el próximo tick
When el controlador emite el tick PlayMove
Then movesRemaining decrementa a 0
And evaluateStatus inspecciona el tablero
And al menos 1 celda reporta hasArrowSegment() == true
And GameStatus transiciona a LOST

Scenario: Bloqueo persistente agota el presupuesto sin progreso topológico
Given una sesión con movesRemaining = 2
And una Flecha F1 cuya celda destino permanece ocupada por F2 inamovible
When el controlador emite ticks PlayMove consecutivos sobre F1
Then después de tick 1: outcome = blocked, movesRemaining = 1, status = IN_PROGRESS
And después de tick 2: outcome = blocked, movesRemaining = 0, status = LOST

# ══════════════════════════════════════════════
# BLOQUE 4 — INVARIANTES DE LA SESIÓN Y TERMINALIDAD DEL ESTADO
# ══════════════════════════════════════════════

Scenario: Una sesión finalizada en WON rechaza nuevos movimientos
Given una sesión con status = WON tras evacuación completa
When el controlador intenta emitir un nuevo tick PlayMove
Then PlayMoveUseCase retorna success = false con error "Game already WON"
And AdvanceArrowUseCase NO es invocado
And movesRemaining permanece inalterado
And el status permanece WON

Scenario: Una sesión finalizada en LOST rechaza nuevos movimientos
Given una sesión con status = LOST por agotamiento del presupuesto
When el controlador intenta emitir un nuevo tick PlayMove
Then PlayMoveUseCase retorna success = false con error "Game already LOST"
And el estado de la sesión permanece inmutable

Scenario: consumeMove() lanza error si el contador ya está en cero
Given una sesión con movesRemaining = 0 y status = IN_PROGRESS
When se invoca GameSession.consumeMove() directamente
Then la sesión lanza el error "NoMovesRemainingError"
And movesRemaining permanece en 0

Scenario: evaluateStatus es idempotente sobre estados terminales
Given una sesión con status = WON
When se invoca evaluateStatus(board) repetidamente con cualquier proyección del tablero
Then el status retornado es siempre WON
And la sesión nunca regresa a IN_PROGRESS
