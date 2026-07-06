# language: es

# ──────────────────────────────────────────────────────────────────────────────
# Feature: game-session-scoring
# Bounded Context: GameSession (Domain layer)
# Responsabilidad: calcular el VO Score como veredicto cuantitativo paralelo
#                  al GameStatus cualitativo (WON/LOST/IN_PROGRESS).
#
# Decisiones de diseño cerradas (ver doc de design):
#   - Score es VO inmutable dentro del aggregate GameSession.
#   - Cálculo híbrido: contadores en streaming, fórmula final al transicionar a WON.
#   - Componentes activos: tiempo (positivo), fallas consecutivas (negativo),
#                          flawlessVictory (bonus discreto).
#   - Componentes ignorados: arrowsEvacuated, movesRemaining.
#   - Penalización por falla N en racha consecutiva: lineal → BASE_PENALTY × N.
#   - Reset de racha: cualquier movimiento exitoso reinicia consecutiveFails a 0.
#   - Unidad de tiempo: ticks (determinista).
#   - Clamp: finalScore = max(0, ...) — sin valores negativos.
#   - LOST e IN_PROGRESS ⇒ score = null.
#   - Persistencia histórica y scaling por nivel: fuera de scope.
# ──────────────────────────────────────────────────────────────────────────────

Característica: Cálculo y composición de la puntuación por sesión de juego
  Como motor del juego Arrow Maze
  Quiero calcular un Score numérico al finalizar una partida ganada
  Para premiar eficiencia temporal y ejecución limpia, penalizando errores
  acumulados especialmente cuando son consecutivos.

  Reglas de cálculo (fórmula consolidada):
    timeScore       = max(0, BASE − ticksUsed × DECAY)
    penaltyForFailN = BASE_PENALTY × consecutiveFailsAt(N)
    flawlessVictory = (totalFails == 0) ∧ (status == WON)
    finalScore      = max(0, timeScore − Σ penaltyForFailN
                               + (flawlessVictory ? FLAWLESS_BONUS : 0))

  Antecedentes:
    Dadas las siguientes constantes de scoring del Domain
      | constante      | valor |
      | BASE           | 1000  |
      | DECAY          | 2     |
      | BASE_PENALTY   | 10    |
      | FLAWLESS_BONUS | 500   |
    Y un tablero base válido con un Arrow inicial colocado
    Y una GameSession en estado IN_PROGRESS

  # ────────────────────────────────────────────────────────────────
  # Grupo 1 — Componente tiempo + bonus flawless
  # ────────────────────────────────────────────────────────────────

  Escenario: Victoria sin fallas otorga timeScore más bonus flawless
    Cuando el jugador completa la sesión con ticksUsed = 100 y totalFails = 0
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser true
    Y el score final debe ser 1300
    # cálculo: timeScore = max(0, 1000 − 100×2) = 800
    #          finalScore = 800 + 500 = 1300

  Escenario: timeScore se hace clamp a 0 cuando ticksUsed excede BASE/DECAY
    Cuando el jugador completa la sesión con ticksUsed = 600 y totalFails = 0
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser true
    Y el score final debe ser 500
    # cálculo: timeScore = max(0, 1000 − 600×2) = max(0, −200) = 0
    #          finalScore = 0 + 500 = 500

  # ────────────────────────────────────────────────────────────────
  # Grupo 2 — Penalización por fallas (aisladas vs consecutivas)
  # ────────────────────────────────────────────────────────────────

  Escenario: Una única falla rompe el flawless pero aplica penalización mínima
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre 1 falla aislada
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser false
    Y el score final debe ser 790
    # cálculo: timeScore = 800, penalización = 10×1 = 10
    #          finalScore = 800 − 10 + 0 = 790

  Escenario: Fallas no consecutivas cuentan cada una como racha de 1
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre la siguiente secuencia de eventos
      | evento |
      | falla  |
      | éxito  |
      | falla  |
      | éxito  |
      | falla  |
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser false
    Y el score final debe ser 770
    # cálculo: cada falla rompe en racha=1 → 3 × (10×1) = 30
    #          finalScore = 800 − 30 = 770

  Escenario: Tres fallas consecutivas aplican multiplicador lineal creciente
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre la siguiente secuencia de eventos
      | evento |
      | falla  |
      | falla  |
      | falla  |
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser false
    Y el score final debe ser 740
    # cálculo: racha 1,2,3 → 10×1 + 10×2 + 10×3 = 60
    #          finalScore = 800 − 60 = 740

  Escenario: Movimiento exitoso resetea la racha de fallas consecutivas
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre la siguiente secuencia de eventos
      | evento |
      | falla  |
      | falla  |
      | éxito  |
      | falla  |
      | falla  |
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser false
    Y el score final debe ser 740
    # cálculo: dos rachas (1,2) y (1,2) → (10+20) + (10+20) = 60
    #          finalScore = 800 − 60 = 740
    # invariante: el éxito intermedio reinicia consecutiveFails a 0

  Escenario: finalScore se hace clamp a 0 cuando las penalizaciones exceden lo positivo
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre una racha consecutiva de 20 fallas
    Y la sesión transiciona al estado WON
    Entonces flawlessVictory debe ser false
    Y el score final debe ser 0
    # cálculo: penalización = 10 × Σ(1..20) = 10 × 210 = 2100
    #          800 − 2100 = −1300 → clamp a 0

  # ────────────────────────────────────────────────────────────────
  # Grupo 3 — Estados terminales y visibilidad
  # ────────────────────────────────────────────────────────────────

  Escenario: Derrota no produce score
    Cuando la sesión transiciona al estado LOST
    Entonces el score final debe ser null
    Y flawlessVictory debe ser false
    Y consultar el score no debe exponer cálculo intermedio alguno

  Escenario: Score no es consultable mientras la sesión está en curso
    Dado que la sesión permanece en estado IN_PROGRESS
    Cuando se intenta consultar el score
    Entonces el score debe ser null
    Y la consulta no debe exponer contadores internos (ticksUsed, consecutiveFails)

  # ────────────────────────────────────────────────────────────────
  # Grupo 4 — Componentes explícitamente descartados
  # ────────────────────────────────────────────────────────────────

  Escenario: arrowsEvacuated no contribuye al score
    Dadas dos sesiones con ticksUsed = 100 y totalFails = 0
    Cuando la primera sesión evacúa 1 flecha y la segunda evacúa 5 flechas
    Y ambas transicionan al estado WON
    Entonces ambos scores finales deben ser iguales
    Y ambos scores deben ser 1300

  Escenario: movesRemaining no contribuye al score
    Dadas dos sesiones con ticksUsed = 100, totalFails = 0 y allowedMoves = 20
    Cuando la primera sesión usa 5 movimientos y la segunda usa 15
    Y ambas transicionan al estado WON
    Entonces ambos scores finales deben ser iguales
    Y ambos scores deben ser 1300

  # ────────────────────────────────────────────────────────────────
  # Grupo 5 — Validación paramétrica de la fórmula lineal
  # ────────────────────────────────────────────────────────────────

  Esquema del escenario: Penalización lineal acumulada por racha consecutiva
    Cuando el jugador completa la sesión con ticksUsed = 100
    Y ocurre una racha consecutiva de <fallas> fallas seguidas
    Y la sesión transiciona al estado WON
    Entonces la penalización total acumulada debe ser <penalizacion>
    Y el score final debe ser <score>

    Ejemplos:
      | fallas | penalizacion | score |
      | 1      | 10           | 790   |
      | 2      | 30           | 770   |
      | 3      | 60           | 740   |
      | 4      | 100          | 700   |
      | 5      | 150          | 650   |
      | 6      | 210          | 590   |
      | 10     | 550          | 250   |
      | 12     | 780          | 20    |
      | 13     | 910          | 0     |
      | 20     | 2100         | 0     |
    # fórmula de penalización acumulada: BASE_PENALTY × Σ(1..fallas) = 10 × n(n+1)/2
    # score = max(0, 800 − penalización)

