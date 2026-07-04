Feature: Detección de colisión en el frente (cola) de la flecha

  Como motor lógico del juego
  Quiero que el avance se bloquee cuando el FRENTE (cola) de una flecha
  multi-celda toparía con una entidad ajena
  Para que toda colisión que se presenta sea obligatoria, no solo la de la cabeza

  # ─────────────────────────────────────────────
  # CONTEXTO DEL HUECO (verificado en código + spec)
  #
  # advance() valida SOLO el destino de la CABEZA (Arrow.ts, fase 3). En una flecha
  # multi-celda el destino de la cabeza es su propio cuerpo (self, que se libera),
  # así que NUNCA bloquea. La única celda que entra a territorio NUEVO es la COLA
  # (el frente del avance) — y su destino hoy no se valida: Cell.placeArrowSegment
  # sobre-escribe en silencio. Resultado: una serpiente atraviesa otra flecha.
  #
  # FIX (mínimo y quirúrgico): en la fase 3, además de la cabeza, validar el destino
  # de la COLA contra ocupación ajena → 'blocked' (rollback, sin mutar nada).
  #
  # Convención de puertos: 0=N, 1=E, 2=S, 3=O.
  # ─────────────────────────────────────────────

  Background: Tablero pasivo de celdas de 4 puertos
    Given un tablero instanciado con celdas pasivas de P=4 puertos
    And la regla aritmética interna de la flecha: opuesto = (puerto + 2) mod 4
    And un controlador que gestiona una sola flecha in-flight a la vez

  # ══════════════════════════════════════════════
  # BLOQUE 1 — COLISIÓN EN LA COLA (EL FIX)
  # ══════════════════════════════════════════════

  Scenario: El frente (cola) de una serpiente se bloquea contra una flecha ajena
    Given una flecha F1 multi-celda cuya COLA avanzaría hacia la celda Cx
    And una flecha F2 ocupando Cx (entidad ajena, no self)
    When F1 recibe el tick de activación
    Then F1 detecta que el destino de su cola (Cx) está ocupado por entidad ajena
    And F1 ejecuta rollback: no muta su cadena ni los contenedores
    And el outcome es 'blocked'
    And Cx (ocupada por F2) permanece intacta
    And freedCellIds y occupiedCellIds quedan vacíos

  Scenario: Bloqueo aunque la cabeza pudiera avanzar (cabeza self, cola ajena)
    Given una flecha F1 multi-celda cuya CABEZA avanzaría a su propio cuerpo (self)
    And cuya COLA avanzaría a una celda ocupada por F2
    When F1 recibe el tick
    Then F1 NO consolida el avance pese a que la cabeza era válida
    And el outcome es 'blocked'

  # ══════════════════════════════════════════════
  # BLOQUE 2 — NO FALSOS POSITIVOS (REGRESIÓN)
  # ══════════════════════════════════════════════

  Scenario: Avance normal cuando el destino de la cola está libre
    Given una flecha F1 multi-celda cuya cola avanza a una celda LIBRE
    When F1 recibe el tick
    Then F1 consolida su avance con outcome 'advanced'
    And la cadena se reconstruye en las celdas destino

  Scenario: La cola hacia un sumidero NO es colisión (se purga, no bloquea)
    Given una flecha F1 multi-celda cuya cola apunta a un exit/sumidero
    When F1 recibe el tick
    Then la cola fluye al sumidero y se purga (la flecha se acorta)
    And el outcome es 'advanced' (no 'blocked')

  Scenario: Lazy checking de celdas FUERA de la ruta se mantiene
    Given una flecha F1 multi-celda
    And una celda ajena adyacente que NO es destino de ningún segmento de F1
    When F1 recibe el tick
    Then F1 ignora esa celda ajena (no es destino de la cola ni de la cabeza)
    And F1 avanza con outcome 'advanced'

  # ══════════════════════════════════════════════
  # BLOQUE 3 — COMPATIBILIDAD (NADA CAMBIA AQUÍ)
  # ══════════════════════════════════════════════

  Scenario: La colisión de cabeza / 1-celda sigue funcionando idéntica
    Given una flecha F1 de 1 celda cuya cabeza (= cola) avanza a una celda ajena
    When F1 recibe el tick
    Then el outcome es 'blocked' (igual que antes del fix)

  Scenario: La auto-colisión (self) nunca bloquea por la nueva validación
    Given una flecha F1 cuya cola avanzaría a una celda ocupada por SU PROPIO cuerpo
    When F1 recibe el tick
    Then esa celda es self (se libera por el arrastre) y NO se reporta colisión
    And F1 avanza normalmente
