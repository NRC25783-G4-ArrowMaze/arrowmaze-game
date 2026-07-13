import { SpinInertia } from '../../src/presentation/input/spinInertia';

/**
 * MODO CUBO — inercia del orbit (ajuste 3 del diseño): soltar con velocidad →
 * el cubo sigue girando y desacelera con damping hasta parar; soltar sin
 * velocidad → quieto. El idle de ~3s corre después de que la inercia muere.
 */
describe('SpinInertia', () => {
  it('soltar sin muestras recientes no produce inercia', () => {
    const inertia = new SpinInertia();
    inertia.release(1000);
    expect(inertia.isAlive).toBe(false);
    expect(inertia.step(0.016)).toBeNull();
  });

  it('un drag rápido produce inercia viva con la dirección del gesto', () => {
    const inertia = new SpinInertia();
    for (let i = 0; i < 5; i++) {
      inertia.addSample(0.04, 0.01, 1000 + i * 16); // ~2.5 rad/s en yaw
    }
    inertia.release(1080);
    expect(inertia.isAlive).toBe(true);
    const d = inertia.step(0.016)!;
    expect(d.dYaw).toBeGreaterThan(0);
    expect(d.dPitch).toBeGreaterThan(0);
    expect(d.dYaw).toBeGreaterThan(d.dPitch); // domina el yaw como el gesto
  });

  it('las muestras viejas (fuera de la ventana) no cuentan: pausa antes de soltar = sin inercia', () => {
    const inertia = new SpinInertia();
    for (let i = 0; i < 5; i++) {
      inertia.addSample(0.05, 0, 1000 + i * 16);
    }
    // El usuario se queda quieto 400ms y suelta.
    inertia.release(1480);
    expect(inertia.isAlive).toBe(false);
  });

  it('desacelera monótonamente (damping) y muere bajo el umbral', () => {
    const inertia = new SpinInertia();
    for (let i = 0; i < 6; i++) {
      inertia.addSample(0.06, 0, 1000 + i * 16);
    }
    inertia.release(1096);
    expect(inertia.isAlive).toBe(true);

    let prev = Infinity;
    let steps = 0;
    while (inertia.isAlive && steps < 2000) {
      const d = inertia.step(0.016);
      if (d === null) {
        break;
      }
      expect(Math.abs(d.dYaw)).toBeLessThanOrEqual(prev + 1e-12);
      prev = Math.abs(d.dYaw);
      steps++;
    }
    // Muere sola en un tiempo razonable (< ~33s de frames simulados).
    expect(inertia.isAlive).toBe(false);
    expect(steps).toBeLessThan(2000);
  });

  it('la velocidad al soltar queda clampeada al tope', () => {
    const inertia = new SpinInertia({ sampleWindowMs: 90, damping: 3, minSpeed: 0.03, maxSpeed: 2 });
    for (let i = 0; i < 5; i++) {
      inertia.addSample(5, 0, 1000 + i * 16); // gesto absurdo
    }
    inertia.release(1080);
    const d = inertia.step(1)!; // 1s a velocidad inicial ≤ 2 rad/s
    expect(Math.abs(d.dYaw)).toBeLessThanOrEqual(2);
  });

  it('cancel() mata la inercia (agarrar el cubo la detiene)', () => {
    const inertia = new SpinInertia();
    for (let i = 0; i < 5; i++) {
      inertia.addSample(0.06, 0, 1000 + i * 16);
    }
    inertia.release(1080);
    expect(inertia.isAlive).toBe(true);
    inertia.cancel();
    expect(inertia.isAlive).toBe(false);
    expect(inertia.step(0.016)).toBeNull();
  });
});
