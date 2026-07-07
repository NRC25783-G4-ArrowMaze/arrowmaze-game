import React from 'react';

/** Props del overlay de pausa (C4). */
export interface PauseOverlayProps {
  /** El caller decide: true cuando el tope de la pila de flujo (C1) es 'PAUSED'. */
  visible: boolean;
  /** Desapila PAUSED y retoma la partida donde quedó. */
  onResume: () => void;
  /** Descarta la partida actual y arranca una fresca sobre la misma escena. */
  onRestart: () => void;
  /** Apila SETTINGS sobre PAUSED. */
  onOpenSettings: () => void;
  /**
   * Navega fuera de la partida (vuelve a la selección de niveles, C3).
   * No transiciona GameFlowController: la partida se descarta al desmontar.
   */
  onExit: () => void;
}

/**
 * PauseOverlay — Overlay de pausa (C4). Mismo patrón visual que GameOverlay:
 * position:absolute;inset:0, estilos inline, sin librería de UI.
 */
export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  visible,
  onResume,
  onRestart,
  onOpenSettings,
  onExit,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="pause-overlay"
      role="dialog"
      aria-label="Pausa"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>Pausa</div>
      <button className="btn-primary" onClick={onResume} style={{ minWidth: '180px' }}>
        Reanudar
      </button>
      <button onClick={onRestart} style={{ minWidth: '180px' }}>
        Reiniciar
      </button>
      <button onClick={onOpenSettings} style={{ minWidth: '180px' }}>
        Ajustes
      </button>
      <button onClick={onExit} style={{ minWidth: '180px' }}>
        Salir
      </button>
    </div>
  );
};
