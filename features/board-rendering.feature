# board-rendering.feature

Feature: Board Static Rendering
  As a player on a web/Android client
  I want the board, its dot grid and its arrows drawn on screen
  So that I can perceive the puzzle state visually

  Background:
    Given a Board has been built from a LevelData JSON
    And each CellData carries grid coordinates "col" and "row" as non-negative integers
    And each ArrowData carries a "color" field as a CSS-compatible string
    And the rendering target is an SVG element inside a web view
    And the SVG background is a solid white fill

  # NOTA: el look de referencia es TEMA CLARO. Esto cambia dos cosas respecto a la
  # versión original del spec:
  #   1. El fondo pasó de azul marino (navy) a BLANCO.
  #   2. La Pasada 1 ya no pinta un punto por Cell del tablero, sino un punto por
  #      cada posición del BOUNDING BOX (grilla completa estilo referencia).
  # Los puntos siguen siendo homogéneos y de un único color neutro (gris claro).

  Rule: The JSON is the single source of truth for layout and color

    The renderer must not infer, compute, randomize, or default any
    positional or chromatic data. Any rendering interface (SVG, debug,
    native) consuming the same LevelData must produce the same logical
    layout and the same per-arrow color identity.

    Scenario: Cell screen position derives from col and row
      Given a Cell with col=3 and row=5
      And a computed cellSize of 40 pixels
      When the renderer positions that Cell
      Then its center is at screen coordinates x = 3 * 40, y = 5 * 40 plus the centering offset
      And no other source of position is consulted

    Scenario: Arrow color comes from ArrowData
      Given an ArrowData declares color "#39FF14"
      When the renderer paints that Arrow
      Then both the body stroke and the head fill use "#39FF14"
      And no fallback color is applied

    Scenario: Missing layout data is a build-time failure, not a render-time guess
      Given a CellData is missing "col" or "row"
      When the LevelData is loaded
      Then construction fails before reaching the renderer
      And the renderer never receives a Cell without position

  Rule: Rendering happens in two ordered passes

    Scenario: Pass 1 paints a dot for every position of the bounding box
      Given a Board whose cells span a bounding box of (maxCol + 1) by (maxRow + 1)
      When the renderer paints the board
      Then it draws a small filled circle at every grid position of that bounding box
      And every dot uses the same neutral light-gray foreground color

    Scenario: Pass 2 paints every Arrow on top of the dots
      Given Pass 1 has completed
      And the Board contains K Arrows
      When the renderer paints Pass 2
      Then it iterates every Arrow
      And for each Arrow it draws a stroked path connecting the centers of the Cells it occupies, in occupation order
      And the path visually occludes any dot underneath it

    Scenario: An empty board still renders the dot grid
      Given a Board with K = 0 Arrows
      When the renderer paints the board
      Then only Pass 1 produces output
      And no Arrow path or head is drawn

  Rule: Arrow body style

    Scenario: Arrow body is a single thick rounded stroke
      Given an Arrow occupies an ordered sequence of Cells
      When the renderer draws its body
      Then a single SVG path connects the Cell centers in order using straight line segments
      And the path uses "stroke-linecap: round"
      And the path uses "stroke-linejoin: round"
      And the stroke width is a fixed fraction of cellSize between 30% and 50%
      And the path has no fill

    Scenario: Single-cell Arrow body still shows a rounded tail
      Given an Arrow that occupies exactly one Cell
      When the renderer draws its body
      Then the path consists of a single point at that Cell's center
      And "stroke-linecap: round" produces a visible rounded cap at that point

  Rule: Arrow head style

    Scenario: Arrow head is a filled triangle at the LEADING cell, pointing toward travel
      Given an Arrow occupies an ordered sequence of Cells
      # En este motor la cabeza (Head) ocupa el extremo TRASERO y el cuerpo se
      # extiende hacia adelante (en dirección del exitPort). La punta visual va,
      # por tanto, en la celda LÍDER (la última en orden de ocupación), no en la
      # celda-cabeza del dominio.
      And the leading cell is the last cell in occupation order
      When the renderer draws the head
      Then a filled triangle is drawn centered on the leading cell
      And the triangle apex points along the last body segment's direction
        (or exitDir for a single-cell Arrow)
      And the triangle fill matches the Arrow's color

    Scenario: Head is drawn after the body of the same Arrow
      Given an Arrow with body and head
      When the renderer draws that Arrow
      Then the body is drawn first
      And the head is drawn second
      And the head visually overlaps the body at Cell H so the cap is hidden behind the triangle base

  Rule: Port-to-direction mapping for P=4

    The mapping from port index to screen direction is a rendering-layer
    convention. The domain uses port indices abstractly; only the renderer
    interprets them as cardinal directions.

    Scenario Outline: Port index maps to a unit grid delta
      Given a Cell with portCount = 4
      When the renderer evaluates port index <port>
      Then the corresponding screen delta is (dCol = <dCol>, dRow = <dRow>)
      And that delta is also used to point Arrow heads exiting through that port

      Examples:
        | port | dCol | dRow | cardinal |
        |  0   |   0  |  -1  |  North   |
        |  1   |  +1  |   0  |  East    |
        |  2   |   0  |  +1  |  South   |
        |  3   |  -1  |   0  |  West    |

  Rule: Viewport fitting is an infrastructure responsibility

    Scenario: cellSize is derived from viewport and board bounding box
      Given the Board's maximum col is C_max and maximum row is R_max
      And the SVG viewport has width W and height H
      When the renderer computes cellSize
      Then cellSize is the largest integer such that
           (C_max + 1) * cellSize <= W
       and (R_max + 1) * cellSize <= H
      And the board is centered inside the viewport with equal margins on the unused axis

# Out of scope for this feature (deferred to later specs):
#   - Animation of Arrow movement between ticks (B2)
#   - User input (taps on Arrows) (B3)
#   - Debug overlays (port numbers, cell ids)
#   - Non-square cell shapes (hex, triangular)
#   - Theme switching / palette variants
