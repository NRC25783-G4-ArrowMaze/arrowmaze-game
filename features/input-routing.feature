# input-routing.feature

Feature: Routing a tap to a movement command
  As a player
  I want to tap an arrow to move it
  So that the engine plays one tick on that arrow

  Background:
    Given the board is rendered as an SVG with the B1 layout (cellSize + offset)
    And a GameSession is IN_PROGRESS
    And the port→delta mapping of B1 defines screen directions

  Rule: A tap is unified across input devices

    Scenario: Mouse, touch and pen all produce a single "tap"
      Given the player interacts with mouse, touch or pen
      When a primary pointer goes down on the SVG
      Then it is treated as one tap

    Scenario: Right click is ignored
      Given the player presses a non-primary button (button != 0)
      When the pointer goes down
      Then no command is emitted

    Scenario: Secondary pointers are ignored
      Given a multi-touch gesture
      When a non-primary pointer goes down
      Then no command is emitted

  Rule: A tap resolves to the arrow under the touched cell

    Scenario: Tap on a cell occupied by an arrow emits one command
      Given an arrow occupies the touched cell
      When the tap is routed
      Then the screen point is inverted to (col,row) using cellSize and offset
      And the arrow under that cell is resolved
      And exactly one PlayMoveCommand with that arrowId is emitted
      And PlayMoveUseCase is invoked once

    Scenario: Tap on an empty cell emits nothing
      Given the touched cell is empty
      When the tap is routed
      Then no command is emitted

    Scenario: Tap outside the board emits nothing
      Given the screen point falls outside the board bounding box
      When the tap is routed
      Then the point inverts to no cell
      And no command is emitted

  Rule: Input does not evaluate game rules

    The adapter never decides collisions, destruction or validity. It only
    routes "the player tapped this arrow" to the engine, which decides.

  Rule: Input is blocked while busy or terminal

    Scenario: A tap during an in-flight move is discarded
      Given a movement is in flight
      When the player taps
      Then the tap is discarded (not queued)

    Scenario: No input is routed in a terminal session
      Given the session status is WON or LOST
      When the player taps
      Then no command is emitted
