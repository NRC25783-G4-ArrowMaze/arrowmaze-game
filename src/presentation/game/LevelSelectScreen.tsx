import React, { useMemo } from 'react';
import type { LevelProgress } from '../../domain/entities/LevelProgress';
import { LevelSelectionProjection } from '../../domain/services/LevelSelectionProjection';
import { LEVEL_MAP } from './levelMap';
import { LevelNodeCard } from './LevelNodeCard';
import { useTranslation } from '../i18n/I18nContext';

interface LevelSelectScreenProps {
  progress: LevelProgress[];
  onSelectLevel: (levelId: string) => void;
  levelMetadata: Record<string, { name: string; difficulty: string }>;
  /** Abre la clasificación del nivel (🏆 de cada card). */
  onOpenLeaderboard?: (levelId: string) => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  levelMetadata,
  onOpenLeaderboard,
}) => {
  const { t } = useTranslation();
  // Derivado puro del progreso: se computa en el render (useMemo), no en un
  // effect con setState — evita el render inicial vacío y las cascadas.
  const derived = useMemo(
    () => LevelSelectionProjection.project(LEVEL_MAP, progress),
    [progress],
  );

  return (
    <div
      className="level-select-screen"
      // Ancho propio dentro del flex centrado de .app-main: sin él, el grid
      // colapsa al contenido. Sin alturas fijas ni overflow propio — el scroll
      // es el natural de la página, así el mapa escala a 50+ niveles.
      style={{ padding: 'clamp(16px, 3vw, 32px)', width: '100%', maxWidth: '1100px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        {/* Color explícito: sin él, el modo oscuro del sistema lo heredaba
            blanco sobre la pantalla clara y el título desaparecía. */}
        <h1 style={{ color: '#1f2937', fontSize: 'clamp(20px, 1.2rem + 0.8vw, 28px)' }}>{t('levelSelect.title')}</h1>
      </header>

      <main
        className="level-grid"
        style={{
          display: 'grid',
          // auto-fill (no auto-fit): con pocos niveles en pantallas anchas las
          // cards mantienen un ancho razonable en vez de estirarse en columnas
          // gigantes.
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 15vw, 220px), 1fr))',
          gap: 'clamp(12px, 2vw, 24px)',
        }}
      >
        {derived.map(node => (
          <LevelNodeCard
            key={node.levelId}
            node={node}
            metadata={levelMetadata[node.levelId]}
            onSelectLevel={() => onSelectLevel(node.levelId)}
            onOpenLeaderboard={
              onOpenLeaderboard === undefined
                ? undefined
                : () => onOpenLeaderboard(node.levelId)
            }
          />
        ))}
      </main>
    </div>
  );
};
