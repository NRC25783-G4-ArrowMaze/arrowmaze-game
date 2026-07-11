import { FetchProgressApiClient } from '../../src/infrastructure/api/FetchProgressApiClient';
import { type IAuthTokenProvider } from '../../src/application/ports/IAuthTokenProvider';
import { LevelProgress } from '../../src/domain/entities/LevelProgress';
import { Score } from '../../src/domain/value-objects/Score';
import { SessionExpiredError } from '../../src/domain/errors/SyncErrors';

// Red de seguridad del contrato HTTP (lección #33): el sync D2 apuntaba a
// /api/progress mientras el backend monta /api/v1/progress → 404 silencioso.
// Estos tests fijan la URL EXACTA (con /v1), el método y el header Bearer para
// upload (POST) y download (GET), con fetch mockeado.

const BASE = 'http://localhost:3000';
const PROGRESS_URL = `${BASE}/api/v1/progress`;

describe('FetchProgressApiClient — contrato HTTP', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let tokenProvider: jest.Mocked<IAuthTokenProvider>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    tokenProvider = {
      getToken: jest.fn().mockResolvedValue('jwt.token'),
      setToken: jest.fn(),
      removeToken: jest.fn(),
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const makeProgress = (): LevelProgress =>
    LevelProgress.create(
      'level-initial',
      Score.createSimpleScore(100),
      5,
      30,
      new Date('2026-01-01T00:00:00.000Z'),
    );

  it('pushProgress: POST a /api/v1/progress con header Authorization Bearer', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    const client = new FetchProgressApiClient(BASE, tokenProvider);

    await client.pushProgress(makeProgress());

    expect(fetchMock).toHaveBeenCalledWith(
      PROGRESS_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt.token' }),
      }),
    );
  });

  it('pushProgress: 401 → SessionExpiredError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const client = new FetchProgressApiClient(BASE, tokenProvider);

    await expect(client.pushProgress(makeProgress())).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it('fetchUserProgress: GET a /api/v1/progress con header Authorization Bearer', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { levelId: 'level-initial', score: 100, movesUsed: 5, timeElapsedSeconds: 30, achievedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });
    const client = new FetchProgressApiClient(BASE, tokenProvider);

    const result = await client.fetchUserProgress();

    expect(fetchMock).toHaveBeenCalledWith(
      PROGRESS_URL,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt.token' }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].levelId).toBe('level-initial');
  });

  it('fetchUserProgress: 401 → SessionExpiredError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const client = new FetchProgressApiClient(BASE, tokenProvider);

    await expect(client.fetchUserProgress()).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
