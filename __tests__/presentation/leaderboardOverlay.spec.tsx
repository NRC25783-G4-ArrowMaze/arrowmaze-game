import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { translate } from '../../src/presentation/i18n/i18n';
import { LeaderboardOverlay } from '../../src/presentation/components/LeaderboardOverlay';
import { GetLevelLeaderboard } from '../../src/application/services/GetLevelLeaderboard';
import {
  type ILeaderboardApiClient,
  LevelNotRegisteredError,
} from '../../src/application/ports/ILeaderboardApiClient';
import type { LeaderboardResponse, LeaderboardEntry } from '../../src/application/dtos/LeaderboardDTOs';
import { SessionExpiredError, NetworkError } from '../../src/domain/errors/SyncErrors';

const T = (key: string): string => translate('es', key);
const noop = (): void => undefined;

const entry = (over: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  rank: 1,
  username: 'juan',
  score: 900,
  movesUsed: 4,
  timeElapsedSeconds: 75,
  achievedAt: '2026-07-09T00:00:00.000Z',
  ...over,
});

interface Harness {
  api: jest.Mocked<ILeaderboardApiClient>;
  useCase: GetLevelLeaderboard;
}

function makeHarness(): Harness {
  const api: jest.Mocked<ILeaderboardApiClient> = { getByLevel: jest.fn() };
  return { api, useCase: new GetLevelLeaderboard(api) };
}

function renderOverlay(
  h: Harness,
  over: Partial<{ isAuthenticated: boolean; onRequestLogin: () => void; onClose: () => void }> = {},
) {
  return render(
    <I18nProvider initialLang="es">
      <LeaderboardOverlay
        visible
        levelId="level-initial"
        isAuthenticated={over.isAuthenticated ?? true}
        getLevelLeaderboard={h.useCase}
        onRequestLogin={over.onRequestLogin ?? noop}
        onClose={over.onClose ?? noop}
      />
    </I18nProvider>,
  );
}

describe('LeaderboardOverlay — estados', () => {
  it('NO LOGUEADO: mensaje + botón que pide login, y NO llama a la red', () => {
    const h = makeHarness();
    const onRequestLogin = jest.fn();
    renderOverlay(h, { isAuthenticated: false, onRequestLogin });

    expect(screen.getByText(T('leaderboard.loginRequired'))).toBeInTheDocument();
    fireEvent.click(screen.getByText(T('leaderboard.loginButton')));
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(h.api.getByLevel).not.toHaveBeenCalled();
  });

  it('CARGANDO: muestra el estado de carga mientras la petición está en vuelo', () => {
    const h = makeHarness();
    h.api.getByLevel.mockReturnValue(new Promise(() => undefined)); // nunca resuelve
    renderOverlay(h);

    expect(screen.getByText(T('leaderboard.loading'))).toBeInTheDocument();
  });

  it('DATOS: filas con rank/alias/score/movidas/tiempo mm:ss + TU récord destacado', async () => {
    const h = makeHarness();
    const response: LeaderboardResponse = {
      topPlayers: [
        entry(),
        entry({ rank: 2, username: 'maria', score: 800, movesUsed: 6, timeElapsedSeconds: 125 }),
      ],
      // El récord propio NO está en el top: debe pintarse igual, destacado abajo.
      currentRecord: entry({ rank: 11, username: 'yo', score: 300, movesUsed: 9, timeElapsedSeconds: 240 }),
    };
    h.api.getByLevel.mockResolvedValue(response);
    renderOverlay(h);

    expect(await screen.findByText('juan')).toBeInTheDocument();
    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    // Tiempo con formatDuration (G3): 75s → 01:15, 125s → 02:05.
    expect(screen.getByText('01:15')).toBeInTheDocument();
    expect(screen.getByText('02:05')).toBeInTheDocument();
    // Tu récord, aunque no esté en el top.
    expect(screen.getByText(T('leaderboard.yourRecord'))).toBeInTheDocument();
    expect(screen.getByText('yo')).toBeInTheDocument();
    expect(screen.getByText('04:00')).toBeInTheDocument();
    // El alias es contenido, no clave i18n; y la petición fue por ESTE nivel.
    expect(h.api.getByLevel).toHaveBeenCalledWith('level-initial');
  });

  it('DATOS sin récord propio (currentRecord null): hint sutil que invita a jugar', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockResolvedValue({ topPlayers: [entry()], currentRecord: null });
    renderOverlay(h);

    expect(await screen.findByText('juan')).toBeInTheDocument();
    expect(screen.getByText(T('leaderboard.noRecord'))).toBeInTheDocument();
    expect(screen.queryByText(T('leaderboard.yourRecord'))).not.toBeInTheDocument();
  });

  it('VACÍO: "aún no hay récords — sé el primero"', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockResolvedValue({ topPlayers: [], currentRecord: null });
    renderOverlay(h);

    expect(await screen.findByText(T('leaderboard.empty'))).toBeInTheDocument();
  });

  it('404 (nivel no registrado): se muestra IGUAL que el vacío + console.warn con el levelId', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockRejectedValue(new LevelNotRegisteredError('level-initial'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(noop);
    try {
      renderOverlay(h);

      expect(await screen.findByText(T('leaderboard.empty'))).toBeInTheDocument();
      expect(screen.queryByText(T('leaderboard.error'))).not.toBeInTheDocument();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('level-initial'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('ERROR DE RED: mensaje de error', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockRejectedValue(new NetworkError('sin conexión'));
    renderOverlay(h);

    expect(await screen.findByText(T('leaderboard.error'))).toBeInTheDocument();
  });

  it('401 EN VUELO (SessionExpiredError): cae al mismo camino de "inicia sesión"', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockRejectedValue(new SessionExpiredError());
    const onRequestLogin = jest.fn();
    renderOverlay(h, { onRequestLogin });

    expect(await screen.findByText(T('leaderboard.loginRequired'))).toBeInTheDocument();
    fireEvent.click(screen.getByText(T('leaderboard.loginButton')));
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
  });

  it('cierra con el botón Volver', async () => {
    const h = makeHarness();
    h.api.getByLevel.mockResolvedValue({ topPlayers: [], currentRecord: null });
    const onClose = jest.fn();
    renderOverlay(h, { onClose });

    await waitFor(() => expect(screen.getByText(T('leaderboard.back'))).toBeInTheDocument());
    fireEvent.click(screen.getByText(T('leaderboard.back')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
