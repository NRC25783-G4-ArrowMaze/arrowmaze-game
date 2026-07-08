Feature: Board Graph Initialization and Representation as In-Memory Node Structure

As a logical game engine
I want to represent a game board as a connected graph of passive cells
To enable path traversal, collision detection, and topological queries

# CORE CONCEPTS (STRICT SRP)

# Cell: "Passive container defined by port quantity (P); P must be even"
# Port: "Static numeric index (0 to P-1) representing connection point"
# Board: "Interconnected cell collection forming game's topological space"
# Arrow: "Intelligent external entity navigating cells"
# GraphNode: Internal representation of cell as node in graph structure
# Connection: Directional port-to-port link between cells or to exit

Background: Board with P=4 ports
Given a board instantiated with passive cells having 4 ports
And the topological rule: opposite port is (p + 2) mod 4

BLOQUE 1 — CREACIÓN E INVARIANTES DE CELDAS

Scenario: Cell creation with valid topology
Given a Cell defined with P = 4 ports
When the Cell is instantiated
Then the Cell has 4 indexed ports (0, 1, 2, 3)
And each port is initially unconnected
And the Cell is immutable after creation

Scenario: Cell creation rejects invalid topology
When attempting to create a Cell with P = 3 (odd number)
Then the system raises error "InvalidTopologyError: P must be even"

Scenario: Cell creation rejects non-integer port count
When attempting to create a Cell with P = 2.5
Then the system raises error "InvalidTopologyError: P must be integer"

Scenario: Cell immutability enforcement
Given a Cell with ports [p0, p1, p2, p3] = [null, null, null, null]
When an external entity attempts to mutate ports[0] = SomeCell
Then the Cell raises error "CellMutationError: immutable after instantiation"

BLOQUE 2 — OCUPACIÓN DE CELDAS INDIVIDUALES

Scenario: Single cell can hold exactly one arrow segment
Given a Cell C1 with 4 ports and arrowSegment = null
When an Arrow places its head on C1
Then C1.arrowSegment is assigned to the head reference
And C1 reports hasArrowSegment() == true
And the same Cell cannot hold two arrow segments simultaneously

Scenario: Only head of an arrow can occupy a cell initially
Given an Arrow with structure [head, body, tail]
When attempting to place the body segment on an empty Cell C1
Then the system raises error "ArrowPlacementError: only arrow head can initialize cell occupancy"

BLOQUE 3 — CONEXIONES ENTRE CELDAS

Scenario: Bidirectional connection between cells
Given two Cells C1 and C2
When connecting C1.port[0] to C2.port[2]
Then C1.port[0] references C2
And C2.port[2] references C1 (bidirectional)
And the connection respects the opposite-port rule: 2 == (0 + 2) mod 4

Scenario: Auto-connection rejection
Given a Cell C1 with port[0] connected to C2
When attempting to connect C1.port[0] to itself
Then the system raises error "ConnectionError: auto-connection forbidden"

Scenario: Port occupancy prevents secondary connection
Given a Cell C1 with port[0] already connected to C2
When attempting to connect C1.port[0] to C3
Then the system raises error "ConnectionError: port already occupied"

BLOQUE 4 — GESTIÓN DEL CONTENEDOR BOARD

Scenario: Board aggregation of cells
Given an empty Board
When adding Cell C1, C2, C3 to the Board
Then Board.cells contains [C1, C2, C3]
And each Cell is reference-equal to the added instances

Scenario: Cell removal maintains graph integrity
Given a Board with connected cells [C1 -- C2 -- C3]
When removing C2 from the Board
Then C2 is no longer in Board.cells
And C1 and C3 remain in Board.cells
And the system optionally reports dangling connection warning

BLOQUE 5 — CONSULTAS TOPOLÓGICAS PASIVAS

Scenario: Board reports neighbor cells by port
Given a Board with C1.port[0] connected to C2
When querying Board.getNeighbor(C1, 0)
Then the result is C2
And the query does not trigger any routing calculation

Scenario: Board reports exit status passively
Given a Cell C1 with port[1] connected to exit (port leads outside graph)
When querying Board.isExit(C1, 1)
Then the result is true
And the query does not create any internal traversal state

Scenario: Cell reports occupancy without routing
Given a Cell C1 with arrowSegment = headRef
When querying C1.hasArrowSegment()
Then the result is true
And the query does not execute any movement logic
