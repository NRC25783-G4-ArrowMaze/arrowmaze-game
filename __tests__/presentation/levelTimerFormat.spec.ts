import { formatDuration } from '../../src/presentation/game/levelTimer';

describe('formatDuration — presentación mm:ss (G3, D2)', () => {
  it.each([
    [0, '00:00'],
    [5, '00:05'],
    [65, '01:05'],
    [754, '12:34'],
  ])('%i segundos → "%s" (Scenario Outline del spec)', (segundos, display) => {
    expect(formatDuration(segundos)).toBe(display);
  });

  it('borde del décimo minuto: 599 → 09:59, 600 → 10:00', () => {
    expect(formatDuration(599)).toBe('09:59');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('60+ minutos: mm sigue creciendo sin acarreo a horas (D2)', () => {
    expect(formatDuration(3600)).toBe('60:00');
    expect(formatDuration(6000)).toBe('100:00');
  });

  it('valores negativos o fraccionarios se sanean a piso ≥ 0', () => {
    expect(formatDuration(-5)).toBe('00:00');
    expect(formatDuration(65.9)).toBe('01:05');
  });
});
