Feature: Nivel Cube 3D (3x3x3)
  Como diseñador de niveles
  Quiero que el motor renderice correctamente y procese las colisiones de un grid 3D de 3x3x3
  Para que los jugadores puedan experimentar un nivel complejo en múltiples capas

  Scenario: Renderizado inicial del Cube 3D
    Given el nivel "level-cube" es cargado
    Then el tablero virtual contiene 27 celdas
    And la capa máxima en el tablero es 2
    And el modo de visualización "mapMode" es "3d"
    And hay 5 flechas dispuestas en las distintas capas

  Scenario: Movimiento con retorno en conexiones 3D (return behavior)
    Given el nivel "level-cube" es cargado con collisionBehavior "return"
    When una flecha se desliza hacia un puerto exterior no conectado
    Then la flecha rebota y vuelve a su celda de origen
