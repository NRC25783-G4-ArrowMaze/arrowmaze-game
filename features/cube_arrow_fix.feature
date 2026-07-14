Feature: Cálculo de puerto opuesto y momentum en Arrow.ts para topologías 3D

  Como motor del juego
  Quiero que Arrow.ts respete los pares topológicos correctos según la dimensionalidad (4 o 6 puertos)
  Para que las colas de las flechas no reboten ni giren incorrectamente al vaciar celdas, 
  y para que las cabezas sin cuerpo hereden el momentum direccional correcto en mapas 3D.

  Scenario: Un segmento 'Tail' calcula correctamente su salida (exitDir) en un tablero 3D (6 puertos)
    Given una flecha cuyo segmento final ('Tail') está en una celda con 6 puertos
    When la cola entró por el puerto "0" (Y-)
    Then la dirección de salida de la cola debe ser "2" (Y+) y no "3" (0+3%6)
    
  Scenario: Un segmento 'Tail' calcula correctamente su salida en un tablero 2D (4 puertos)
    Given una flecha cuyo segmento final ('Tail') está en una celda con 4 puertos
    When la cola entró por el puerto "1" (Este)
    Then la dirección de salida de la cola debe ser "3" (Oeste) usando la lógica fallback

  Scenario: Una cabeza ('Head') solitaria hereda el momentum correcto en un tablero 3D (6 puertos)
    Given una flecha que se ha encogido a 1 solo segmento ('Head') en este tick
    And la celda en la que acaba de entrar tiene 6 puertos
    When la conexión recorrida desde la celda anterior indica que el puerto vecino es "4" (Z+)
    Then la cabeza debe actualizar su exitPort (momentum) hacia "5" (Z-) y no hacia "1" (4+3%6)
