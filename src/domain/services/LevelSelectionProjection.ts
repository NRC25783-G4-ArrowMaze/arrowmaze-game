import type { LevelProgress } from '../entities/LevelProgress';

/**
 * Forma mínima de un nodo del mapa que la proyección necesita. Se declara en el
 * dominio (en vez de importar el DTO de la capa application) para no depender de
 * capas externas; cualquier `LevelMapDTO` la satisface estructuralmente.
 */
export interface LevelMapNode {
  levelId: string;
  prerequisites: string[];
  starThresholds?: [number, number];
}

export interface DerivedNode {
  levelId: string;
  state: 'bloqueado' | 'disponible' | 'completado';
  isFocal: boolean;
  bestScore?: number;
  stars?: number;
  prerequisites: string[];
}

export class LevelSelectionProjection {
  /**
   * Deriva el estado de cada nodo del mapa a partir del catálogo y el progreso local.
   * Determinista y puro — sin efectos secundarios.
   */
  static project(levelMap: LevelMapNode[], progress: LevelProgress[]): DerivedNode[] {
    const progressMap = new Map(progress.map(p => [p.levelId, p]));
    const levelIdSet = new Set(levelMap.map(n => n.levelId));

    const derived = levelMap.map(node => {
      const isCompleted = progressMap.has(node.levelId);
      const canBeAvailable = node.prerequisites.length === 0 ||
        node.prerequisites.every(prereq => {
          if (!levelIdSet.has(prereq)) return false;
          return progressMap.has(prereq);
        });

      const state: 'bloqueado' | 'disponible' | 'completado' =
        isCompleted ? 'completado' :
        canBeAvailable ? 'disponible' :
        'bloqueado';

      const bestScore = isCompleted
        ? progressMap.get(node.levelId)!.score.finalScore
        : undefined;

      const stars = isCompleted && node.starThresholds
        ? this.computeStars(bestScore!, node.starThresholds)
        : undefined;

      return {
        levelId: node.levelId,
        state,
        isFocal: false,
        bestScore,
        stars,
        prerequisites: node.prerequisites,
      };
    });

    const focalIndex = derived.findIndex(
      n => n.state === 'disponible' && !progressMap.has(n.levelId)
    );
    if (focalIndex >= 0) {
      derived[focalIndex].isFocal = true;
    }

    return derived;
  }

  private static computeStars(bestScore: number, [twoStar, threeStar]: [number, number]): number {
    if (bestScore >= threeStar) return 3;
    if (bestScore >= twoStar) return 2;
    return 1;
  }
}
