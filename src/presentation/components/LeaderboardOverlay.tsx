import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import type { GetLevelLeaderboard } from '../../application/services/GetLevelLeaderboard';
import { LevelNotRegisteredError } from '../../application/ports/ILeaderboardApiClient';
import type { LeaderboardEntry, LeaderboardResponse } from '../../application/dtos/LeaderboardDTOs';
import { formatDuration } from '../game/levelTimer';

/** Props del overlay de clasificación por nivel. */
export interface LeaderboardOverlayProps {
  /** El caller decide la visibilidad (🏆 de cada card del mapa). */
  visible: boolean;
  /** Nivel cuya clasificación se muestra. */
  levelId: string;
  /** Sesión activa conocida por App: sin sesión no se dispara la petición. */
  isAuthenticated: boolean;
  getLevelLeaderboard: GetLevelLeaderboard;
  /** El leaderboard es EL motivo para loguearse: abre el AccountOverlay. */
  onRequestLogin: () => void;
  onClose: () => void;
}

type State =
  | { kind: 'loginRequired' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'data'; response: LeaderboardResponse };

/**
 * LeaderboardOverlay — Clasificación de un nivel (mismo patrón visual que
 * AccountOverlay: modal a pantalla completa .overlay-backdrop/.overlay-card,
 * estilos inline).
 *
 * Estados: no logueado (mensaje + CTA de login, SIN tocar la red) · cargando ·
 * error de red · vacío · datos (top + récord propio destacado). Un 401 en vuelo
 * cae al mismo camino de login. El 404 (nivel no registrado en el backend) se
 * muestra IGUAL que el vacío: hasta que el seed registre los niveles del mapa
 * es la respuesta real de niveles legítimos, y "aún no hay récords" es
 * funcionalmente honesto — se registra un console.warn para desarrollo.
 * Los alias (`username`) son contenido del usuario: no se traducen.
 */
export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  visible,
  levelId,
  isAuthenticated,
  getLevelLeaderboard,
  onRequestLogin,
  onClose,
}) => {
  const { t } = useTranslation();
  // El estado inicial ya es el correcto para el primer render (loading o
  // loginRequired); el effect solo dispara la petición y reporta su resultado
  // (callbacks async → sin setState síncrono en el cuerpo del effect). El
  // caller remonta por nivel (key=levelId), así que no hay retarget en vivo.
  const [state, setState] = useState<State>(
    isAuthenticated ? { kind: 'loading' } : { kind: 'loginRequired' },
  );

  useEffect(() => {
    if (!visible || !isAuthenticated) {
      return;
    }
    let active = true;
    getLevelLeaderboard
      .execute(levelId)
      .then((response) => {
        if (active) setState({ kind: 'data', response });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof LevelNotRegisteredError) {
          // Equivalencia visual decidida en diseño: vacío honesto + aviso dev.
          console.warn(`[LeaderboardOverlay] Nivel sin registro en el backend: ${levelId}`);
          setState({ kind: 'data', response: { topPlayers: [], currentRecord: null } });
          return;
        }
        if (error instanceof Error && error.name === 'SessionExpiredError') {
          setState({ kind: 'loginRequired' });
          return;
        }
        setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, [visible, isAuthenticated, levelId, getLevelLeaderboard]);

  if (!visible) {
    return null;
  }

  const cellStyle: React.CSSProperties = { padding: '6px 10px', color: '#374151' };
  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 700,
    borderBottom: '2px solid var(--border, #d1d5db)',
  };

  const renderRow = (e: LeaderboardEntry, highlighted: boolean): React.ReactElement => (
    <tr
      key={`${e.rank}-${e.username}`}
      style={highlighted ? { background: '#fef9c3', fontWeight: 700 } : undefined}
    >
      <td style={cellStyle}>{e.rank}</td>
      {/* Alias seguro del backend: contenido, jamás clave i18n. */}
      <td style={cellStyle}>{e.username}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{e.score}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{e.movesUsed}</td>
      {/* Tiempo reutilizando formatDuration (G3): mm:ss. */}
      <td style={{ ...cellStyle, textAlign: 'right' }}>{formatDuration(e.timeElapsedSeconds)}</td>
    </tr>
  );

  return (
    <div
      data-testid="leaderboard-overlay"
      role="dialog"
      aria-label={t('leaderboard.title')}
      className="overlay-backdrop"
    >
      <div className="overlay-card">
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>
          🏆 {t('leaderboard.title')}
        </div>

        {state.kind === 'loginRequired' && (
          <>
            <div style={{ color: '#6b7280' }}>{t('leaderboard.loginRequired')}</div>
            <button
              className="btn-primary"
              onClick={onRequestLogin}
              style={{ minWidth: '220px', maxWidth: '100%' }}
            >
              {t('leaderboard.loginButton')}
            </button>
          </>
        )}

        {state.kind === 'loading' && (
          <div style={{ color: '#6b7280' }}>{t('leaderboard.loading')}</div>
        )}

        {state.kind === 'error' && (
          <div style={{ color: 'var(--danger, #b91c1c)' }}>{t('leaderboard.error')}</div>
        )}

        {state.kind === 'data' &&
          (state.response.topPlayers.length === 0 ? (
            <div style={{ color: '#6b7280' }}>{t('leaderboard.empty')}</div>
          ) : (
            <div style={{ maxHeight: 'min(50dvh, 420px)', overflowY: 'auto', width: 'min(420px, 100%)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>{t('leaderboard.col.rank')}</th>
                    <th style={{ ...headerCellStyle, textAlign: 'left' }}>
                      {t('leaderboard.col.player')}
                    </th>
                    <th style={headerCellStyle}>{t('leaderboard.col.score')}</th>
                    <th style={headerCellStyle}>{t('leaderboard.col.moves')}</th>
                    <th style={headerCellStyle}>{t('leaderboard.col.time')}</th>
                  </tr>
                </thead>
                <tbody>{state.response.topPlayers.map((e) => renderRow(e, false))}</tbody>
              </table>

              {state.response.currentRecord !== null ? (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#374151', padding: '0 10px' }}>
                    {t('leaderboard.yourRecord')}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <tbody>{renderRow(state.response.currentRecord, true)}</tbody>
                  </table>
                </div>
              ) : (
                <div style={{ marginTop: '12px', color: '#6b7280', padding: '0 10px' }}>
                  {t('leaderboard.noRecord')}
                </div>
              )}
            </div>
          ))}

        <button onClick={onClose} style={{ minWidth: '220px', maxWidth: '100%' }}>
          {t('leaderboard.back')}
        </button>
      </div>
    </div>
  );
};
