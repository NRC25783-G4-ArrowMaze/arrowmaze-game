import React, { useEffect, useState } from 'react';
import type { LevelProgress } from '../../domain/entities/LevelProgress';
import type { DerivedNode } from '../../domain/services/LevelSelectionProjection';
import { LevelSelectionProjection } from '../../domain/services/LevelSelectionProjection';
import { LEVEL_MAP } from './levelMap';
import { LevelNodeCard } from './LevelNodeCard';
import { t } from '../i18n/i18n';

interface LevelSelectScreenProps {
  progress: LevelProgress[];
  onSelectLevel: (levelId: string) => void;
  levelMetadata: Record<string, { name: string; difficulty: string }>;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  levelMetadata,
}) => {
  const [derived, setDerived] = useState<DerivedNode[]>([]);

  useEffect(() => {
    const nodes = LevelSelectionProjection.project(LEVEL_MAP, progress);
    setDerived(nodes);
  }, [progress]);

  return (
    <div className="level-select-screen" style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>{t('c3.title')}</h1>
      </header>

      <main
        className="level-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}
      >
        {derived.map(node => (
          <LevelNodeCard
            key={node.levelId}
            node={node}
            metadata={levelMetadata[node.levelId]}
            onSelectLevel={() => onSelectLevel(node.levelId)}
          />
        ))}
      </main>
    </div>
  );
};
