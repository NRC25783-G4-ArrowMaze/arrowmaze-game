import { LevelTimer } from '../../src/presentation/game/levelTimer';
import type { IClock } from '../../src/application/ports/IClock';

/** Reloj falso inyectable: el test controla el avance del tiempo sin esperas reales (D3). */
class FakeClock implements IClock {
  private t = 0;
  now(): number {
    return this.t;
  }
  advance(ms: number): void {
    this.t += ms;
  }
  set(ms: number): void {
    this.t = ms;
  }
}

describe('LevelTimer — tiempo activo con reloj inyectado (G3)', () => {
  it('arranca en cero (D1)', () => {
    const timer = new LevelTimer(new FakeClock());
    expect(timer.elapsedSeconds()).toBe(0);
  });

  it('avanza un segundo por cada segundo del reloj', () => {
    const clock = new FakeClock();
    const timer = new LevelTimer(clock);
    timer.start();
    clock.advance(5_000);
    expect(timer.elapsedSeconds()).toBe(5);
  });

  it('la pausa CONGELA el timer sin acumular el tiempo pausado (bug clásico)', () => {
    const clock = new FakeClock();
    const timer = new LevelTimer(clock);
    timer.start();
    clock.advance(90_000); // 01:30 activos
    expect(timer.elapsedSeconds()).toBe(90);

    timer.pause();
    clock.advance(45_000); // 45s de reloj real EN PAUSA
    expect(timer.elapsedSeconds()).toBe(90); // no cuentan

    timer.start(); // reanuda sin salto
    expect(timer.elapsedSeconds()).toBe(90);
    clock.advance(10_000);
    expect(timer.elapsedSeconds()).toBe(100);
  });

  it('conserva el valor al detenerse en WON/LOST', () => {
    const clock = new FakeClock();
    const timer = new LevelTimer(clock);
    timer.start();
    clock.advance(130_000); // 02:10
    timer.pause(); // estado terminal congela igual que la pausa
    clock.advance(999_999);
    expect(timer.elapsedSeconds()).toBe(130);
  });

  it('restart/reset vuelve a cero (D4)', () => {
    const clock = new FakeClock();
    const timer = new LevelTimer(clock);
    timer.start();
    clock.advance(200_000);
    timer.reset();
    expect(timer.elapsedSeconds()).toBe(0);
    expect(timer.running).toBe(false);
  });

  it('start() es idempotente: no reinicia el tramo en curso', () => {
    const clock = new FakeClock();
    const timer = new LevelTimer(clock);
    timer.start();
    clock.advance(3_000);
    timer.start(); // no-op
    clock.advance(2_000);
    expect(timer.elapsedSeconds()).toBe(5);
  });

  it('es reproducible: misma secuencia de instantes → mismo tiempo activo (D3)', () => {
    const run = (): number => {
      const clock = new FakeClock();
      const timer = new LevelTimer(clock);
      timer.start();
      clock.advance(12_000);
      timer.pause();
      clock.advance(8_000);
      timer.start();
      clock.advance(3_000);
      timer.pause();
      return timer.elapsedSeconds();
    };
    expect(run()).toBe(run());
    expect(run()).toBe(15);
  });
});
