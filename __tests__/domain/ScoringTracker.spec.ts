import { ScoringTracker } from '../../src/domain/value-objects/ScoringTracker';

// ─────────────────────────────────────────────
// CONSTRUCTOR
// ─────────────────────────────────────────────

describe('ScoringTracker — constructor', () => {
  it('inicializa todos los contadores en 0', () => {
    const tracker = new ScoringTracker();
    expect(tracker.ticksUsed).toBe(0);
    expect(tracker.totalFails).toBe(0);
    expect(tracker.consecutiveFails).toBe(0);
    expect(tracker.accumulatedPenalty).toBe(0);
  });
});

// ─────────────────────────────────────────────
// recordTick
// ─────────────────────────────────────────────

describe('ScoringTracker — recordTick', () => {
  it('incrementa ticksUsed en 1', () => {
    const tracker = new ScoringTracker();
    tracker.recordTick();
    expect(tracker.ticksUsed).toBe(1);
  });

  it('múltiples ticks: ticksUsed refleja la cuenta total', () => {
    const tracker = new ScoringTracker();
    tracker.recordTick();
    tracker.recordTick();
    tracker.recordTick();
    expect(tracker.ticksUsed).toBe(3);
  });
});

// ─────────────────────────────────────────────
// recordFailure
// ─────────────────────────────────────────────

describe('ScoringTracker — recordFailure', () => {
  it('incrementa consecutiveFails, totalFails y accumulatedPenalty en primera falla', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure();
    expect(tracker.consecutiveFails).toBe(1);
    expect(tracker.totalFails).toBe(1);
    expect(tracker.accumulatedPenalty).toBe(10);
  });

  it('penalización del fallo N en racha = BASE_PENALTY × N', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure(); // streak 1 → +10
    tracker.recordFailure(); // streak 2 → +20
    expect(tracker.accumulatedPenalty).toBe(30);
    expect(tracker.consecutiveFails).toBe(2);
    expect(tracker.totalFails).toBe(2);
  });

  it('múltiples fallas consecutivas acumulan penalización lineal creciente', () => {
    const tracker = new ScoringTracker();
    // 5 consecutive fails: 10+20+30+40+50 = 150
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure();
    }
    expect(tracker.accumulatedPenalty).toBe(150);
    expect(tracker.consecutiveFails).toBe(5);
    expect(tracker.totalFails).toBe(5);
  });
});

// ─────────────────────────────────────────────
// recordSuccess
// ─────────────────────────────────────────────

describe('ScoringTracker — recordSuccess', () => {
  it('resetea consecutiveFails a 0', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure();
    tracker.recordFailure();
    expect(tracker.consecutiveFails).toBe(2);
    tracker.recordSuccess();
    expect(tracker.consecutiveFails).toBe(0);
  });

  it('no modifica totalFails ni accumulatedPenalty', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure(); // penalty=10, totalFails=1
    tracker.recordSuccess();
    expect(tracker.totalFails).toBe(1);
    expect(tracker.accumulatedPenalty).toBe(10);
  });
});

// ─────────────────────────────────────────────
// SECUENCIAS DE EVENTOS
// ─────────────────────────────────────────────

describe('ScoringTracker — secuencias de eventos', () => {
  it('falla-éxito-falla-éxito-falla: 3 rachas de 1 → penalty = 30', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure(); // streak 1 → +10
    tracker.recordSuccess(); // reset
    tracker.recordFailure(); // streak 1 → +10
    tracker.recordSuccess(); // reset
    tracker.recordFailure(); // streak 1 → +10
    expect(tracker.accumulatedPenalty).toBe(30);
    expect(tracker.totalFails).toBe(3);
    expect(tracker.consecutiveFails).toBe(1);
  });

  it('falla-falla-éxito-falla-falla: dos rachas (1,2)(1,2) → penalty = 60', () => {
    const tracker = new ScoringTracker();
    tracker.recordFailure(); // streak 1 → +10
    tracker.recordFailure(); // streak 2 → +20
    tracker.recordSuccess(); // reset
    tracker.recordFailure(); // streak 1 → +10
    tracker.recordFailure(); // streak 2 → +20
    expect(tracker.accumulatedPenalty).toBe(60);
    expect(tracker.totalFails).toBe(4);
    expect(tracker.consecutiveFails).toBe(2);
  });
});

// ─────────────────────────────────────────────
// VALIDACIÓN PARAMÉTRICA — RACHA CONSECUTIVA
// ─────────────────────────────────────────────

describe('ScoringTracker — validación paramétrica racha consecutiva', () => {
  it.each([
    { fallas: 1,  penalizacion: 10   },
    { fallas: 2,  penalizacion: 30   },
    { fallas: 3,  penalizacion: 60   },
    { fallas: 4,  penalizacion: 100  },
    { fallas: 5,  penalizacion: 150  },
    { fallas: 6,  penalizacion: 210  },
    { fallas: 10, penalizacion: 550  },
    { fallas: 12, penalizacion: 780  },
    { fallas: 13, penalizacion: 910  },
    { fallas: 20, penalizacion: 2100 },
  ])('racha de $fallas fallas → penalización acumulada = $penalizacion',
    ({ fallas, penalizacion }) => {
      const tracker = new ScoringTracker();
      for (let i = 0; i < fallas; i++) {
        tracker.recordFailure();
      }
      expect(tracker.accumulatedPenalty).toBe(penalizacion);
    }
  );
});
