Feature: Forge 3D View and Connections
  Como diseñador de niveles
  Quiero ver las capas adyacentes a la capa activa con un desplazamiento isométrico
  Para poder trazar y visualizar fácilmente las conexiones 3D (puertos 4 y 5) entre las distintas capas

  Scenario: Visualización de capas múltiples
    Given el Forge tiene un nivel 3D con celdas en las capas 0, 1 y 2
    When configuro la capa activa a 1
    Then el lienzo renderiza las celdas de la capa 0 (opacidad baja), capa 1 (opacidad 100%) y capa 2 (opacidad baja)
    And las celdas de la capa 0 se dibujan desplazadas con un offset visual hacia abajo a la izquierda (-50, +50)
    And las celdas de la capa 2 se dibujan desplazadas con un offset visual hacia arriba a la derecha (+50, -50)

  Scenario: Trazar conexión inter-capa visible
    Given el Forge tiene un nivel 3D
    And hay una celda en la capa 0 y una celda en la capa 1
    And la capa activa es la 0
    When selecciono la herramienta 'connect'
    And hago clic en el puerto 4 (▲) de la celda en la capa 0
    And hago clic en el puerto 5 (▼) de la celda en la capa 1
    Then se crea una conexión en el dominio
    And el lienzo renderiza una línea punteada que conecta directamente la posición proyectada del puerto en la capa 0 con la posición proyectada del puerto en la capa 1
