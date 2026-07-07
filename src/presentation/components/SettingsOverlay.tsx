import React from 'react';

/** Props del overlay de ajustes (C4). */
export interface SettingsOverlayProps {
  /** El caller decide: true cuando el tope de la pila de flujo (C1) es 'SETTINGS'. */
  visible: boolean;
  /** Desapila SETTINGS: vuelve a PAUSED, nunca directo a ACTIVE. */
  onClose: () => void;
}

/**
 * SettingsOverlay — Contenedor de ajustes (C4). Solo placeholders: no lee ni
 * escribe i18n.ts (G2) ni ningún estado de audio (G1). Cuando esas features
 * se implementen, reemplazan el contenido de cada sección sin tocar el
 * contrato de props (visible/onClose).
 */
export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ visible, onClose }) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="settings-overlay"
      role="dialog"
      aria-label="Ajustes"
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
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>Ajustes</div>
      <section style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '4px 0' }}>Idioma</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>Próximamente</p>
      </section>
      <section style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '4px 0' }}>Audio</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>Próximamente</p>
      </section>
      <button onClick={onClose}>Volver</button>
    </div>
  );
};
