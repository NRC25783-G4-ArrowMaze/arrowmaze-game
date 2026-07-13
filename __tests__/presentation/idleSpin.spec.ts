import { idleAngularVelocity, DEFAULT_IDLE_SPIN } from '../../src/presentation/game/cube/idleSpin';

/**
 * MODO CUBO — rampa del giro automático: pausa de ~3s tras interactuar y
 * reanudación con arranque suave (easing), no de golpe.
 */
describe('idleAngularVelocity — rampa del idle-spin', () => {
  const cfg = { delayMs: 3000, rampMs: 1000, maxSpeed: 0.3 };

  it('permanece quieto durante el delay tras la interacción', () => {
    expect(idleAngularVelocity(0, cfg)).toBe(0);
    expect(idleAngularVelocity(1500, cfg)).toBe(0);
    expect(idleAngularVelocity(3000, cfg)).toBe(0);
  });

  it('arranca suave: a mitad de rampa va a menos de la mitad de velocidad (ease-in)', () => {
    const midRamp = idleAngularVelocity(3500, cfg); // 50% de la rampa
    expect(midRamp).toBeGreaterThan(0);
    expect(midRamp).toBeLessThan(cfg.maxSpeed / 2); // cuadrático: 0.25 · max
    expect(midRamp).toBeCloseTo(cfg.maxSpeed * 0.25, 10);
  });

  it('alcanza velocidad de crucero al terminar la rampa y se queda ahí', () => {
    expect(idleAngularVelocity(4000, cfg)).toBeCloseTo(cfg.maxSpeed, 10);
    expect(idleAngularVelocity(60000, cfg)).toBeCloseTo(cfg.maxSpeed, 10);
  });

  it('la rampa es monótona creciente', () => {
    let prev = -1;
    for (let t = 3000; t <= 4000; t += 100) {
      const v = idleAngularVelocity(t, cfg);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('la config por defecto pausa ~3s como pide el diseño', () => {
    expect(DEFAULT_IDLE_SPIN.delayMs).toBe(3000);
    expect(DEFAULT_IDLE_SPIN.maxSpeed).toBeGreaterThan(0);
  });
});
