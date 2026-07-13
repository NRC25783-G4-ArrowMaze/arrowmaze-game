import {
  approachAngle,
  courtesyTarget,
  isFaceVisible,
} from '../../src/presentation/game/cube/cubeCourtesy';

/**
 * MODO CUBO — cámara de cortesía: solo desenlaces en cara oculta; giro suave;
 * el llamador la cancela ante drag o inercia (reglas del diseño).
 */
describe('cubeCourtesy', () => {
  const PITCH_LIMIT = 1.25;

  describe('isFaceVisible', () => {
    it('cara frontal a la cámara → visible', () => {
      // Cámara frente a la cara front (normal +z), a distancia.
      expect(
        isFaceVisible({ x: 0, y: 0, z: 1 }, { x: 1.5, y: 1.5, z: 3 }, { x: 1.5, y: 1.5, z: 10 }),
      ).toBe(true);
    });

    it('cara opuesta a la cámara → oculta', () => {
      // La cara back (normal −z) con la cámara del lado +z.
      expect(
        isFaceVisible({ x: 0, y: 0, z: -1 }, { x: 1.5, y: 1.5, z: 0 }, { x: 1.5, y: 1.5, z: 10 }),
      ).toBe(false);
    });

    it('cara de canto (perpendicular) queda bajo el umbral → tratada como oculta', () => {
      expect(
        isFaceVisible({ x: 1, y: 0, z: 0 }, { x: 3, y: 1.5, z: 1.5 }, { x: 3, y: 1.5, z: 10 }),
      ).toBe(false);
    });
  });

  describe('courtesyTarget', () => {
    it('normal +x → yaw = π/2 (cámara al costado derecho)', () => {
      const t = courtesyTarget({ x: 1, y: 0, z: 0 }, 0, PITCH_LIMIT);
      expect(t.yaw).toBeCloseTo(Math.PI / 2, 10);
      expect(t.pitch).toBeCloseTo(0, 10);
    });

    it('elige la vuelta más cercana al yaw actual (camino corto, sin girar de más)', () => {
      // Yaw actual ~2π: el objetivo crudo 0 debe ajustarse a 2π, no volver a 0.
      const t = courtesyTarget({ x: 0, y: 0, z: 1 }, Math.PI * 2 - 0.3, PITCH_LIMIT);
      expect(t.yaw).toBeCloseTo(Math.PI * 2, 10);
    });

    it('cara de arriba: clampea el pitch al límite del orbit y conserva el yaw actual', () => {
      const t = courtesyTarget({ x: 0, y: 1, z: 0 }, 1.234, PITCH_LIMIT);
      expect(t.pitch).toBeCloseTo(PITCH_LIMIT, 10);
      expect(t.yaw).toBeCloseTo(1.234, 10);
    });
  });

  describe('approachAngle', () => {
    it('converge monótonamente al objetivo sin sobrepasarlo', () => {
      let angle = 0;
      const target = 1.5;
      let prevDist = Infinity;
      for (let i = 0; i < 200; i++) {
        angle = approachAngle(angle, target, 3.5, 0.016);
        const d = Math.abs(target - angle);
        expect(d).toBeLessThanOrEqual(prevDist);
        prevDist = d;
      }
      expect(angle).toBeCloseTo(target, 2);
    });
  });
});
