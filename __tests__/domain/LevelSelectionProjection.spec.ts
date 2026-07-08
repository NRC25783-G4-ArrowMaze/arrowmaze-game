import { LevelSelectionProjection } from '../../src/domain/services/LevelSelectionProjection';
import type { LevelMapDTO } from '../../src/application/dtos/LevelMapDTOs';
import { LevelProgress } from '../../src/domain/entities/LevelProgress';
import { Score } from '../../src/domain/value-objects/Score';

describe('LevelSelectionProjection', () => {
  const levelMap: LevelMapDTO = [
    { levelId: 'L1', prerequisites: [] },
    { levelId: 'L2', prerequisites: ['L1'] },
    { levelId: 'L3', prerequisites: ['L1'] },
    { levelId: 'L4', prerequisites: ['L2', 'L3'] },
    { levelId: 'L5', prerequisites: ['L4'] },
  ];

  describe('desbloqueo y estado de nodo (regla 1)', () => {
    it('sin progreso, solo la raíz está disponible', () => {
      const nodes = LevelSelectionProjection.project(levelMap, []);
      expect(nodes[0].state).toBe('disponible');
      expect(nodes[1].state).toBe('bloqueado');
      expect(nodes[2].state).toBe('bloqueado');
      expect(nodes[3].state).toBe('bloqueado');
      expect(nodes[4].state).toBe('bloqueado');
    });

    it('completar la raíz desbloquea sus sucesores directos', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(1000), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes[0].state).toBe('completado');
      expect(nodes[1].state).toBe('disponible');
      expect(nodes[2].state).toBe('disponible');
      expect(nodes[3].state).toBe('bloqueado');
      expect(nodes[4].state).toBe('bloqueado');
    });

    it('un nodo de unión requiere TODOS sus prerequisitos (AND)', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L2', Score.createSimpleScore(1000), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes[3].state).toBe('bloqueado');
    });

    it('el nodo de unión se desbloquea al completar todos los prerequisitos', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L2', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L3', Score.createSimpleScore(1000), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes[3].state).toBe('disponible');
      expect(nodes[4].state).toBe('bloqueado');
    });

    it('un prerequisito inexistente mantiene el nodo bloqueado', () => {
      const mapWithGhost: LevelMapDTO = [
        ...levelMap,
        { levelId: 'LX', prerequisites: ['L_GHOST'] },
      ];
      const nodes = LevelSelectionProjection.project(mapWithGhost, []);
      expect(nodes[5].state).toBe('bloqueado');
    });

    it('completar es monótono — menor score no revierte', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(3200), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes[0].bestScore).toBe(3200);
      expect(nodes[0].state).toBe('completado');
    });
  });

  describe('nodo focal (regla 2)', () => {
    it('el focal es el primer disponible sin completar', () => {
      const nodes = LevelSelectionProjection.project(levelMap, []);
      expect(nodes[0].isFocal).toBe(true);
      expect(nodes.filter(n => n.isFocal)).toHaveLength(1);
    });

    it('con varios disponibles, solo uno es focal', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(1000), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      const focal = nodes.find(n => n.isFocal);
      expect(focal?.levelId).toBe('L2');
    });

    it('con todos completados, no hay nodo focal', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L2', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L3', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L4', Score.createSimpleScore(1000), 0, 0),
        LevelProgress.create('L5', Score.createSimpleScore(1000), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes.filter(n => n.isFocal)).toHaveLength(0);
    });
  });

  describe('métricas de rendimiento (regla 3)', () => {
    it('nodo completado muestra bestScore y sin estrellas sin umbrales', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(2500), 0, 0),
      ];
      const nodes = LevelSelectionProjection.project(levelMap, progress);
      expect(nodes[0].bestScore).toBe(2500);
      expect(nodes[0].stars).toBeUndefined();
    });

    it('estrellas se derivan de starThresholds [2000, 3000]', () => {
      const mapWithStars: LevelMapDTO = [
        { levelId: 'L1', prerequisites: [], starThresholds: [2000, 3000] },
      ];
      const testCases = [
        { score: 500, stars: 1 },
        { score: 1999, stars: 1 },
        { score: 2000, stars: 2 },
        { score: 2999, stars: 2 },
        { score: 3000, stars: 3 },
        { score: 5000, stars: 3 },
      ];

      testCases.forEach(({ score, stars }) => {
        const progress = [
          LevelProgress.create('L1', Score.createSimpleScore(score), 0, 0),
        ];
        const nodes = LevelSelectionProjection.project(mapWithStars, progress);
        expect(nodes[0].stars).toBe(stars);
      });
    });

    it('nodo no jugado no muestra métricas', () => {
      const nodes = LevelSelectionProjection.project(levelMap, []);
      const availableNode = nodes.find(n => n.state === 'disponible');
      expect(availableNode?.bestScore).toBeUndefined();
      expect(availableNode?.stars).toBeUndefined();
    });
  });

  describe('determinismo (regla 4)', () => {
    it('misma entrada produce misma salida', () => {
      const progress = [
        LevelProgress.create('L1', Score.createSimpleScore(2500), 0, 0),
      ];
      const result1 = LevelSelectionProjection.project(levelMap, progress);
      const result2 = LevelSelectionProjection.project(levelMap, progress);

      expect(result1).toEqual(result2);
    });
  });
});
