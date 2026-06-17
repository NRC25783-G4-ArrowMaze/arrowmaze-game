import { Score } from '../../src/domain/value-objects/Score';
import { ScoringTracker } from '../../src/domain/value-objects/ScoringTracker';

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

function buildTracker(ticks: number, consecutiveFails: number): ScoringTracker {
  const tracker = new ScoringTracker();
  for (let i = 0; i < ticks - consecutiveFails; i++) {
    tracker.recordTick();
    tracker.recordSuccess();
  }
  for (let i = 0; i < consecutiveFails; i++) {
    tracker.recordTick();
    tracker.recordFailure();
  }
  return tracker;
}

function buildTrackerWithSequence(
  events: Array<'tick-success' | 'tick-fail'>
): ScoringTracker {
  const tracker = new ScoringTracker();
  for (const event of events) {
    tracker.recordTick();
    if (event === 'tick-fail') {
      tracker.recordFailure();
    } else {
      tracker.recordSuccess();
    }
  }
  return tracker;
}

// ─────────────────────────────────────────────
// COMPONENTE TIEMPO + FLAWLESS
// ─────────────────────────────────────────────

describe('Score — compute: componente tiempo + flawless', () => {
  it('ticksUsed=100, 0 fails → timeScore=800, flawless=true, finalScore=1300', () => {
    const tracker = buildTracker(100, 0);
    const score = Score.compute(tracker);
    expect(score.timeScore).toBe(800);
    expect(score.flawlessVictory).toBe(true);
    expect(score.finalScore).toBe(1300);
  });

  it('ticksUsed=600, 0 fails → timeScore clamped a 0, flawless=true, finalScore=500', () => {
    const tracker = buildTracker(600, 0);
    const score = Score.compute(tracker);
    expect(score.timeScore).toBe(0);
    expect(score.flawlessVictory).toBe(true);
    expect(score.finalScore).toBe(500);
  });

  it('ticksUsed=0, 0 fails → timeScore=1000, flawless=true, finalScore=1500', () => {
    const tracker = new ScoringTracker();
    const score = Score.compute(tracker);
    expect(score.timeScore).toBe(1000);
    expect(score.flawlessVictory).toBe(true);
    expect(score.finalScore).toBe(1500);
  });
});

// ─────────────────────────────────────────────
// PENALIZACIÓN POR FALLAS
// ─────────────────────────────────────────────

describe('Score — compute: penalización por fallas', () => {
  it('ticksUsed=100, 1 falla aislada (penalty=10) → flawless=false, finalScore=790', () => {
    // falla aislada: 1 falla, luego éxito (racha reiniciada), total 100 ticks
    const tracker = buildTrackerWithSequence([
      'tick-fail',
      ...Array(99).fill('tick-success') as Array<'tick-success'>,
    ]);
    const score = Score.compute(tracker);
    expect(score.flawlessVictory).toBe(false);
    expect(score.penaltyTotal).toBe(10);
    expect(score.finalScore).toBe(790);
  });

  it('ticksUsed=100, 3 fallas consecutivas al final (penalty=60) → finalScore=740', () => {
    const tracker = buildTracker(100, 3);
    const score = Score.compute(tracker);
    expect(score.penaltyTotal).toBe(60);
    expect(score.finalScore).toBe(740);
  });

  it('ticksUsed=100, 20 fallas consecutivas → finalScore clamped a 0', () => {
    const tracker = buildTracker(100, 20);
    const score = Score.compute(tracker);
    expect(score.finalScore).toBe(0);
  });
});

// ─────────────────────────────────────────────
// FLAWLESSVICTORY FLAG
// ─────────────────────────────────────────────

describe('Score — compute: flawlessVictory flag', () => {
  it('totalFails=0 → flawlessVictory=true', () => {
    const tracker = new ScoringTracker();
    tracker.recordTick();
    tracker.recordSuccess();
    expect(Score.compute(tracker).flawlessVictory).toBe(true);
  });

  it('totalFails>0 → flawlessVictory=false', () => {
    const tracker = new ScoringTracker();
    tracker.recordTick();
    tracker.recordFailure();
    expect(Score.compute(tracker).flawlessVictory).toBe(false);
  });
});

// ─────────────────────────────────────────────
// IMMUTABILITY (M-1: Object.freeze en constructor)
// ─────────────────────────────────────────────

describe('Score — immutability', () => {
  it('properties son readonly via Object.freeze — asignación lanza TypeError en strict mode', () => {
    const tracker = new ScoringTracker();
    const score = Score.compute(tracker);

    expect(() => {
      // @ts-expect-error — verifica que Object.freeze previene mutación en runtime
      score.finalScore = 9999;
    }).toThrow(TypeError);
  });
});
