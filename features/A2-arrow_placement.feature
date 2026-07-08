Feature: Colocación inicial de flechas en el tablero

Como motor lógico del juego
Quiero instanciar y colocar una flecha (entidad inteligente) sobre los nodos del grafo
Para que la flecha establezca su estado topológico inicial

Background: Board con P=4 puertos
Given un board instanciado con celdas pasivas de 4 puertos
And la regla topológica: puerto opuesto es (p + 2) mod 4

BLOQUE 1 — CREACIÓN E INVARIANTES

Scenario: Creación de flecha mínima con exitPort
When se instancia una Arrow con un segment head y exitPort = 2
Then la Arrow existe en memoria
And head.exitPort == 2
And head.prev == null
And head.next == null

Scenario: Head como inicio válido
Given una Arrow instanciada con solo head
Then head es el primer segmento (inicio de lista)
And head.prev es null

Scenario: Last segment como fin válido
Given una Arrow con head y dos segmentos body adicionales
Then tail (último segmento) tiene next == null

Scenario: Enlazamiento interno de segmentos
Given una Arrow con [head, body1, body2, tail]
Then head.next == body1
And body1.prev == head
And body1.next == body2
And body2.prev == body1

Scenario: Longitud refleja ocupación en grafo
Given una Arrow de 3 segmentos [head, body, tail]
Then Arrow.length == 3

Scenario: exitPort puede apuntar al vacío
When una Arrow head tiene exitPort = 3 apuntando a exit
Then la Arrow es válida incluso si no hay celda conectada en ese puerto

BLOQUE 2 — COLOCACIÓN Y AUTO-ENRUTAMIENTO

Scenario: Colocación masiva de N segmentos
When se coloca una Arrow de 5 segmentos en las celdas [C1, C2, C3, C4, C5]
Then cada segmento ocupa exactamente una celda
And la ocupación refleja el orden de la lista enlazada

Scenario: Colocación incremental delegada
Given una Arrow colocada en [C1(head)]
When se añade un body segment a la Arrow
Then la Arrow calcula automáticamente puerto de entrada (fromPort)
And coloca el body en la celda siguiente según la topología

Scenario: Notificación a celdas pasivas
Given celdas pasivas [C1, C2, C3]
When se coloca una Arrow [head, body, tail] en [C1, C2, C3]
Then C1.notifyOccupancy(head)
And C2.notifyOccupancy(body)
And C3.notifyOccupancy(tail)

Scenario: Cálculo de puertos internos (trayectoria lineal)
Given una Arrow colocada en [C1(head, exitPort:2), C2, C3]
When se calcula la trayectoria interna
Then body.fromPort == (2 + 2) mod 4 == 0
And body.exitPort == 2
And tail.fromPort == 0

Scenario: Cálculo de puertos internos (curva)
Given una Arrow colocada en [C1(exitPort:1) -> C1b -> C2b]
When se calcula la topología
Then C1b recibe fromPort = (1 + 2) mod 4 = 3
And C1b computa exitPort navegando la curva
And C2b hereda exitPort de C1b

Scenario: Segmento de cola sin puerto de salida
Given una Arrow con tail colocado
Then tail.exitPort == null
And tail.next == null

BLOQUE 3 — RESTRICCIONES DE COLOCACIÓN

Scenario: Rechazo hacia celda desconectada
Given una Flecha head colocada en C1(exitPort:2)
When se intenta colocar el body en una celda que NO está conectada a C1.port[2]
Then la operación lanza error "PlacementError: target cell not connected"

Scenario: Rechazo sobre celda ocupada
Given una Flecha F1 occupando C2
When se intenta colocar otra Flecha F2 en la misma C2
Then el sistema lanza error "PlacementError: cell already occupied by F1"

Scenario: Rechazo de auto-colisión
Given una Flecha F1 de 3 segmentos [head, body, tail] en [C1, C2, C3]
When se intenta colocar el head en C2 (donde está el body)
Then el sistema lanza error "PlacementError: arrow cannot collide with itself"

Scenario: Obligatoriedad de colocar cabeza primero
Given una Flecha instanciada sin colocación
When se intenta colocar directamente el body
Then el sistema lanza error "PlacementError: head must be placed first"

Scenario: Obligatoriedad de definir exitPort
Given una Flecha instanciada
When se intenta colocar el head sin especificar exitPort
Then el sistema lanza error "PlacementError: exitPort must be explicitly defined"

BLOQUE 4 — INVARIANTES MATEMÁTICOS

Scenario: exitPort exclusivo de cabeza
Given una Arrow con [head, body, tail]
Then head.exitPort != null
And body.exitPort != null
And tail.exitPort == null

Scenario: Aritmética modular en puertos
Given una Arrow navegando puertos con P = 4
Then para cada segmento interno: fromPort == (previousSegment.exitPort + P/2) mod P

Scenario: Cabeza carece de fromPort
Given una Arrow head colocada
Then head.fromPort == null
And head.prev == null

Scenario: Limpieza de rastro al removerse
Given una Arrow ocupando [C1, C2, C3]
When la Arrow se remueve del grafo
Then C1.arrowSegment = null
And C2.arrowSegment = null
And C3.arrowSegment = null
And el grafo recupera su estado original sin referencias fantasma
