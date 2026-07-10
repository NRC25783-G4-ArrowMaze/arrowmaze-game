import { FetchLeaderboardApiClient } from '../../src/infrastructure/api/FetchLeaderboardApiClient';
import { LevelNotRegisteredError } from '../../src/application/ports/ILeaderboardApiClient';
import { type IAuthTokenProvider } from '../../src/application/ports/IAuthTokenProvider';
import { SessionExpiredError, NetworkError } from '../../src/domain/errors/SyncErrors';

/**
 * Spec de CONTRATO del adapter (lección #33/#39): fija la URL exacta con /v1,
 * el método, el header Bearer y el mapeo de status → error tipado, para que
 * una regresión de contrato no vuelva a pasar silenciosa.
 */
describe('FetchLeaderboardApiClient — contrato HTTP', () => {
  const BASE = 'http://localhost:3000';

  const tokens: jest.Mocked<IAuthTokenProvider> = {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
    getEmail: jest.fn(),
    setEmail: jest.fn(),
    removeEmail: jest.fn(),
  };

  const okBody = {
    topPlayers: [
      {
        rank: 1,
        username: 'juan',
        score: 900,
        movesUsed: 4,
        timeElapsedSeconds: 75,
        achievedAt: '2026-07-09T00:00:00.000Z',
      },
    ],
    currentRecord: null,
  };

  let fetchMock: jest.Mock;

  beforeEach(() => {
    tokens.getToken.mockReset().mockResolvedValue('jwt-abc');
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const jsonResponse = (status: number, body: unknown): Response =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }) as Response;

  it('GET a la URL exacta /api/v1/leaderboards/:levelId con Bearer', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, okBody));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    await client.getByLevel('level-initial');

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/v1/leaderboards/level-initial`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-abc' }),
      }),
    );
  });

  it('200 → devuelve el DTO tal cual (topPlayers + currentRecord)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, okBody));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    const result = await client.getByLevel('level-initial');

    expect(result.topPlayers).toHaveLength(1);
    expect(result.topPlayers[0]).toEqual(okBody.topPlayers[0]);
    expect(result.currentRecord).toBeNull();
  });

  it('200 con tablero vacío → { topPlayers: [], currentRecord: null } (NO es error)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { topPlayers: [], currentRecord: null }));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    const result = await client.getByLevel('level-initial');

    expect(result.topPlayers).toEqual([]);
    expect(result.currentRecord).toBeNull();
  });

  it('401 → SessionExpiredError (la casa ya sabe por qué)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'unauthorized' }));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    await expect(client.getByLevel('level-initial')).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it('404 → LevelNotRegisteredError, DISTINTO del vacío (contrato fiel; la equivalencia visual la decide la UI)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: 'LevelRegistryError' }));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    await expect(client.getByLevel('level-ghost')).rejects.toBeInstanceOf(LevelNotRegisteredError);
  });

  it('otro status no-ok (500) → NetworkError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'boom' }));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    await expect(client.getByLevel('level-initial')).rejects.toBeInstanceOf(NetworkError);
  });

  it('fallo de red (fetch rechaza) → NetworkError', async () => {
    fetchMock.mockRejectedValue(new TypeError('failed to fetch'));
    const client = new FetchLeaderboardApiClient(BASE, tokens);

    await expect(client.getByLevel('level-initial')).rejects.toBeInstanceOf(NetworkError);
  });
});
