Feature: Resolución y desplazamiento topológico de entidades direccionales (Flechas)

Como motor lógico del juego
Quiero que la entidad activa (Flecha) evalúe y ejecute su propia trayectoria sobre el grafo pasivo
Para determinar si avanza correctamente, se bloquea por ocupación, o se destruye al alcanzar límites topológicos

# CONCEPTOS CLAVE DEL DOMINIO (SRP ESTRICTO)

# Graph / Cell: Contenedor pasivo. Desconoce reglas de movimiento.
# Arrow: Entidad inteligente. Resuelve su cinemática y solicita cruzar puertos.
# Advance: Tick de movimiento atómico. La flecha itera todos sus segmentos simultáneamente.
# In-flight: Estado transaccional de la Flecha durante la evaluación matemática.
# Simulation: Validación previa solicitada por la Flecha para asegurar disponibilidad del puerto destino.
# Rollback: Reversión atómica de la Flecha a su estado anterior si la simulación falla.
# Head-push: La cabeza calcula y dicta el puerto de avance; el cuerpo hereda la posición del nodo previo.

# INVARIANTE DE MOVIMIENTO

# En cada tick: exactamente 1 nodo nuevo es reclamado (por la cabeza) y 1 es liberado (por la cola).
# Si hay rollback: La flecha cancela su petición y los contenedores mantienen su estado de ocupación original.

Background: Tablero pasivo y gestor de movimiento

Given un tablero instanciado con celdas pasivas de P=4 puertos
And la regla aritmética interna de la flecha: opuesto = (puertoEntrada + 2) mod 4
And un controlador de movimiento que gestiona una sola flecha in-flight a la vez

# BLOQUE 1 — MOVIMIENTO EXITOSO Y DESTRUCCIÓN PEREZOSA

Scenario: Destrucción inmediata de cabeza-única apuntando a un sumidero (exit)

Given la Flecha colocada en [C1(head, exitPort:0)]
When el controlador emite el tick de activación
Then la Flecha entra en estado in-flight
And la Flecha consulta pasivamente el puerto 0 de C1 y recibe isExit() == true
And la cabeza fluye hacia el sumidero lógico
And la Flecha se auto-destruye en 1 tick
And la Flecha notifica a C1 para liberar su referencia (arrowSegment = null)

Scenario: Avance de cabeza-única propagándose hasta el límite del grafo

Given la Flecha colocada en [C1(head, exitPort:2)]
When el controlador emite la secuencia de activación
Then tick 1: la Flecha solicita avance a C2 por el puerto 2
And C1 queda libre
And C2 asume la ocupación
And cabeza.exitPort interno sigue siendo 2
And tick 2: la Flecha solicita avance a C3 por el puerto 2
And C2 queda libre
And C3 asume la ocupación
And tick 3: la Flecha detecta isExit() en el puerto 2 de C3
And C3 queda libre
And la Flecha finaliza su ciclo de vida y se destruye

Scenario: Avance simultáneo de cuerpo completo (Head-push cinemático)

Given la Flecha ensamblada en [C1(head, exitPort:2), C2(body), C3(tail)]
When el controlador emite el tick de activación
Then tick 1: la Flecha resuelve paralelamente el movimiento de todos los segmentos
And cabeza avanza de C1 a C2
And cuerpo hereda la posición anterior de cabeza (C1 -> C2)
And cola hereda la posición anterior del cuerpo (C2 -> C3)
And después de tick 1: la Flecha ocupa [C2, C3]
And tick 2: cabeza avanza de C2 a C3 por puerto 2
And después de tick 2: la Flecha ocupa [C3]
And tick 3: cabeza detecta exit en puerto 2
And la Flecha se ha liberado del grafo completamente

# BLOQUE 2 — RESOLUCIÓN DE COLISIONES Y ROLLBACK ATÓMICO

Scenario: Detección de colisión estructural delegada a la simulación de la Flecha

Given una Flecha F1 ocupando [C1(head, exitPort:1)]
And una Flecha F2 ocupando [C1b(head, exitPort:2)]
When F1 recibe el tick de activación
Then F1 simula internamente su cruce hacia C1b por el puerto 1
And F1 detecta que el contenedor C1b reporta arrowSegment != null (ocupado por F2)
And F1 aborta su propia transición cinemática
And F1 ejecuta rollback interno: su cabeza mantiene anclaje estricto en C1
And el contenedor C1b jamás es alterado
And F1 emite el estado de dominio "ArrowBlocked"

Scenario: Liberación asíncrona de ruta compartida (Prioridad de evacuación)

Given una Flecha F1 bloqueada en C1 intentando acceder a C2
And una Flecha F2 ocupando [C2(head, exitPort:2), C2b(body)]
When el controlador emite ticks de activación sobre F2
Then F2 evacúa hacia el sumidero tras 2 ticks
And el contenedor C2 notifica estado libre
When el controlador emite un nuevo tick sobre F1
Then F1 simula su cruce hacia C2 exitosamente
And F1 transiciona de C1 a C2

Scenario: Rollback atómico garantiza inmutabilidad de la estructura enlazada

Given una Flecha F1 de 5 segmentos distribuida en [N1..N5]
And F1 simula un avance hacia un nodo Nx actualmente ocupado
When la Flecha gatilla su protocolo de rollback
Then la Flecha preserva intactos todos sus punteros internos prev/next
And la Flecha mantiene su longitud exacta en 5
And el grafo pasivo no sufre mutaciones de estado intermedio

# BLOQUE 3 — CÁLCULO CINEMÁTICO DURANTE EL VUELO (IN-FLIGHT)

Scenario: Evaluación de colisión estrictamente perezosa (Lazy checking)

Given la Flecha F1 ocupando [C1(head, exitPort:2), C2(body), C3(tail)]
And un contenedor C2b adyacente ocupado por otra entidad
When F1 procesa su simulación in-flight
Then F1 solo interroga al contenedor C2 (destino de C1 por puerto 2)
And F1 ignora el estado de C2b (fuera de la predicción cinemática)
And F1 consolida su avance porque C2 queda libre por el arrastre de su propio cuerpo

Scenario: Bloqueo de mutación topológica por transacción in-flight

Given una Flecha F1 con estado interno In-flight = true
When el motor intenta inyectar un nuevo segmento en F1
Then F1 lanza el error "ArrowCinematicError: immutable segment chain during flight transaction"
When el motor intenta forzar la destrucción parcial de un segmento
Then F1 lanza el error "ArrowCinematicError: immutable segment chain during flight transaction"

Scenario: Resolución matemática y propagación de puertos en curvas dinámicas

Given la Flecha colocada en [C1(head, exitPort:1), C1b(body), C2b(tail)]
When el controlador emite el tick de activación
Then estado cinemático calculado por F1: segmentos avanzan a [C1b, C2b, C3b]
And all port calculations are resolved atomically without intermediate state
