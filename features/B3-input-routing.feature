# input-routing.feature

Feature: Player Input Capture and Routing
  As a player on a web/Android client
  I want my taps and clicks on an Arrow to drive that Arrow's move
  So that I can play the puzzle by pointing at the piece I want to advance

  Background:
    Given a Board has been rendered on screen from a LevelData JSON (per B1)
    And each rendered Arrow occupies an ordered sequence of Cells under a stable arrowId
    And a GameSession exists with status IN_PROGRESS and movesRemaining > 0 (per A4)
    And an InputAdapter in the presentation layer listens for pointer events
    And the InputAdapter routes accepted input to PlayMoveUseCase as PlayMoveCommand{ arrowId }
    And the topology guarantees each Cell holds at most one Arrow segment (per A3)

  Rule: The input layer holds no game rules

    The InputAdapter only translates a screen coordinate into an Arrow
    identity and forwards a command. It never evaluates collisions, never
    reads movesRemaining, never mutates the Board or the GameSession. Every
    verdict (advance, blocked, destroyed, win, loss) belongs to the engine.

    Scenario: A tap forwards a command without judging its validity
      Given an Arrow "F1" whose next move the engine will report as blocked
      When the player taps any Cell occupied by "F1"
      Then the InputAdapter emits PlayMoveCommand{ arrowId: "F1" } exactly once
      And the InputAdapter does not inspect the target Cell's occupancy itself
      And the blocked verdict is produced by the engine, not by the input layer

  Rule: A pointer event resolves to at most one Arrow identity

    Resolution is renderer-agnostic: a screen coordinate is mapped back to a
    grid Cell using the inverse of B1's cellSize and centering offsets, and the
    Board is queried for the Arrow occupying that Cell. SVG element identity is
    one valid implementation, but the logical resolution is always
    coordinate -> Cell -> Arrow.

    Scenario: Tapping the body of an Arrow selects the whole Arrow
      Given an Arrow "F1" occupying Cells [C_head, C_body, C_tail]
      When the player taps Cell C_body
      Then the resolved identity is "F1"
      And PlayMoveCommand{ arrowId: "F1" } is emitted

    Scenario: Tapping the head of an Arrow selects the same Arrow
      Given an Arrow "F1" occupying Cells [C_head, C_body, C_tail]
      When the player taps Cell C_head
      Then the resolved identity is "F1"
      And PlayMoveCommand{ arrowId: "F1" } is emitted

    Scenario Outline: Any occupied Cell of an Arrow resolves to that Arrow
      Given an Arrow "F1" occupying the ordered Cells [C0, C1, C2]
      When the player taps Cell <tapped>
      Then the resolved identity is "F1"

      Examples:
        | tapped |
        |  C0    |
        |  C1    |
        |  C2    |

    Scenario: Tapping a residue dot of an empty Cell emits no command
      Given a Cell C_empty that no Arrow occupies
      When the player taps C_empty
      Then no Arrow identity is resolved
      And no PlayMoveCommand is emitted
      And PlayMoveUseCase is not invoked

    Scenario: Tapping outside the board bounding box is ignored
      Given a screen coordinate outside the rendered board area
      When the player taps that coordinate
      Then no Arrow identity is resolved
      And PlayMoveUseCase is not invoked

    Scenario: Screen coordinate maps to a grid Cell via the inverse of B1 layout
      Given the cellSize and centering offsets the renderer used (per B1)
      And a tap at screen coordinates (x, y) inside the board
      When the InputAdapter resolves the coordinate
      Then it derives col and row by inverting the same cellSize and offsets
      And it queries the Board for the Arrow occupying that (col, row)

  Rule: Mouse and touch are unified into one abstract tap

    Scenario: A left click and a single touch produce the same command
      Given an Arrow "F1" on the board
      When the player left-clicks a Cell of "F1"
      Then PlayMoveCommand{ arrowId: "F1" } is emitted
      When instead the player taps the same Cell with one finger
      Then the identical PlayMoveCommand{ arrowId: "F1" } is emitted

    Scenario: Secondary mouse button does not route a move
      Given an Arrow "F1" on the board
      When the player presses the secondary (right) mouse button on "F1"
      Then no PlayMoveCommand is emitted

    Scenario: Multi-touch honors only the primary pointer
      Given an Arrow "F1" and an Arrow "F2" on the board
      When two fingers tap "F1" and "F2" within the same gesture
      Then only the primary pointer's Arrow yields a command
      And exactly one PlayMoveCommand is emitted

  Rule: One tap on an Arrow routes exactly one move

    Scenario: A single tap emits exactly one command
      Given an Arrow "F1" on the board
      When the player taps "F1" once
      Then exactly one PlayMoveCommand{ arrowId: "F1" } reaches PlayMoveUseCase
      And the adapter does not auto-repeat while the pointer is held

  Rule: Input is locked while a move is in flight

    A move routed to the engine opens an in-flight transaction (per A3: one
    Arrow in-flight at a time). Until the engine reports completion, further
    taps are dropped so a single move is never consumed twice.

    Scenario: Taps during an unresolved move are dropped
      Given a PlayMoveCommand for "F1" has been routed and is still in flight
      When the player taps "F2" before the engine reports completion
      Then the tap on "F2" is discarded
      And no second PlayMoveCommand is emitted

    Scenario: A rapid double-tap routes only one move
      Given an Arrow "F1" on the board
      When the player taps "F1" twice in rapid succession
      Then the first tap emits PlayMoveCommand{ arrowId: "F1" }
      And the second tap is dropped because the move is still in flight
      And exactly one PlayMoveCommand reaches the engine

    Scenario: Input unlocks when the engine reports completion
      Given a move for "F1" the engine reports as success, blocked, or destroyed
      When the engine signals the in-flight transaction is complete
      Then the InputAdapter accepts the next tap
      And a subsequent tap on a valid Arrow emits a new PlayMoveCommand

  Rule: Input is gated on terminal game state

    Consistent with A4, a session whose status is WON or LOST rejects new
    moves; the input layer stops emitting commands once the status is terminal.

    Scenario Outline: No command is emitted once the game is terminal
      Given a GameSession with status <status>
      When the player taps any Arrow on the board
      Then no PlayMoveCommand is emitted
      And PlayMoveUseCase is not invoked

      Examples:
        | status |
        |  WON   |
        |  LOST  |

# Out of scope for this feature (deferred to later specs):
#   - Visual selection highlight and move animation (B2)
#   - In-flight rendering of the Arrow during AdvanceArrowUseCase (B2)
#   - Drag/swipe to choose a direction (the engine fixes exitPort; not player-chosen)
#   - Keyboard / gamepad input mappings
#   - Undo / move cancellation (single-tap activation is immediate)
#   - Pause, settings and other UI controls (C4)
#   - Hover / cursor affordances on non-touch devices
