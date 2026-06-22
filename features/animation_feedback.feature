# animation_feedback.feature

Feature: Animation feedback for a movement tick
  As a player
  I want each tap to animate the REAL behaviour of one tick
  So that I can read what the engine did (advance, block or destroy)

  Background:
    Given the board is rendered with the reference look (B1)
    And the presentation is the "caller": it captures the pre-tick occupation,
        calls PlayMoveUseCase, reads the outcome and then animates
    And the port→delta mapping of B1 defines screen directions (0=N,1=E,2=S,3=O)

  Rule: One tap animates exactly one tick — never a full traversal

    The animation reflects a single cell of movement per tick, matching the
    engine: head advances one cell, tail releases one cell. The animation must
    not move the arrow across the whole board on a single tap.

  Rule: The animation never writes back to the domain (determinism)

    Scenario: Disabling animations leaves the final state identical
      Given a tick whose engine outcome is known
      When the animation layer plays it
      Then it only reads the pre/post occupation and the outcome
      And it never mutates Board, Arrow or GameSession
      And disabling animations yields the exact same final rendered state

  Rule: Blocking model during the animation window

    Scenario: Input and the next tick are blocked while a tick animates
      Given a tick is animating
      When the player taps again during the animation window
      Then that tap is discarded (not queued)
      And no new tick is executed until the window ends

  Rule: advanced → glide

    Scenario: The arrow glides one cell toward its exitPort
      Given the engine outcome is "advanced"
      And the head's exitPort before the tick is port P
      When the animation plays
      Then every segment glides one cell in the screen direction of P, in parallel
      And the head ends on the new cell and the body follows behind
      And the arrow ends drawn at the post-tick occupation

  Rule: blocked → recoil

    Scenario: The head is pushed toward exitPort and springs back
      Given the engine outcome is "blocked"
      When the animation plays
      Then the head is pushed a fraction of cellSize toward its exitPort
      And then it springs back to its original position
      And there is no flash and no shake
      And the arrow that blocks does not react

  Rule: destroyed → fade

    Scenario: The arrow fades out leaving in its direction
      Given the engine outcome is "destroyed"
      When the animation plays
      Then the arrow drifts in the direction of its exitPort while its opacity falls to 0
      And it is removed from the scene when the window ends

# Out of scope here:
#   - Multi-arrow choreography in a single tick (engine moves one arrow per tick)
#   - Curved-body per-segment glide (B2 scope: uniform glide toward exitPort)
#   - Sound / haptics
