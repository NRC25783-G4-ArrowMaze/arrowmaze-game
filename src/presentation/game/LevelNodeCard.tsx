import React from 'react';
import type { DerivedNode } from '../../domain/services/LevelSelectionProjection';
import { t } from '../i18n/i18n';

interface LevelNodeCardProps {
  node: DerivedNode;
  metadata?: { name: string; difficulty: string };
  onSelectLevel: () => void;
}

export const LevelNodeCard: React.FC<LevelNodeCardProps> = ({
  node,
  metadata,
  onSelectLevel,
}) => {
  const isBlocked = node.state === 'bloqueado';
  const isFocal = node.isFocal && !isBlocked;

  const handleClick = () => {
    if (isBlocked) {
      alert(t('c3.locked.notice'));
      return;
    }
    onSelectLevel();
  };

  const stars = node.stars ? '★'.repeat(node.stars) : '';

  return (
    <div
      onClick={handleClick}
      className={`level-node-card ${node.state} ${isFocal ? 'focal' : ''}`}
      style={{
        opacity: isBlocked ? 0.5 : 1,
        cursor: isBlocked ? 'not-allowed' : 'pointer',
        transform: isFocal ? 'scale(1.1)' : isBlocked ? 'scale(0.9)' : 'scale(1)',
        transition: 'all 0.2s ease',
        padding: '16px',
        margin: '8px',
        border: isFocal ? '2px solid #4CAF50' : '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: isBlocked ? '#f5f5f5' : '#fff',
        minWidth: '140px',
        textAlign: 'center',
      }}
    >
      <div className="level-node-title" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {metadata?.name || node.levelId}
      </div>

      {isBlocked && (
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
      )}

      {node.state === 'completado' && (
        <>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>✓</div>
          {node.stars !== undefined && (
            <div style={{ fontSize: '16px', marginBottom: '4px', color: '#FFD700' }}>
              {stars}
            </div>
          )}
          <div style={{ fontSize: '14px', color: '#666' }}>
            Score: {node.bestScore}
          </div>
        </>
      )}

      {node.state === 'disponible' && !isFocal && (
        <div style={{ fontSize: '12px', color: '#999' }}>
          {t('c3.status.available')}
        </div>
      )}

      {isFocal && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#4CAF50',
            animation: 'pulse 1s infinite',
          }}
        >
          Siguiente →
        </div>
      )}

      {metadata?.difficulty && (
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>
          {metadata.difficulty}
        </div>
      )}
    </div>
  );
};
