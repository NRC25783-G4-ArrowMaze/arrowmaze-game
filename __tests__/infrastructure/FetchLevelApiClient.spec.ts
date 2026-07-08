import { FetchLevelApiClient } from '../../src/infrastructure/api/FetchLevelApiClient';
import { NetworkError } from '../../src/domain/errors/SyncErrors';
import type { LevelDataDTO } from '../../src/application/dtos/LevelDataDTOs';

describe('FetchLevelApiClient', () => {
  const fakeLevel: LevelDataDTO = {
    id: 'sample-level-2',
    allowedMoves: 13,
    cells: [{ id: '0,0', portCount: 4 }],
    connections: [],
    arrows: [{ id: 'blue', head: { cellId: '0,0', exitPort: 1 }, body: [] }],
  };

  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should_request_level_from_api_v1_levels_endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeLevel,
    });
    const client = new FetchLevelApiClient('http://localhost:3000');

    const result = await client.fetchLevel('sample-level-2');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/levels/sample-level-2',
      expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) }),
    );
    expect(result).toEqual(fakeLevel);
  });

  it('should_throw_network_error_on_http_error_status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const client = new FetchLevelApiClient('http://localhost:3000');

    await expect(client.fetchLevel('ghost_level')).rejects.toThrow(NetworkError);
    await expect(client.fetchLevel('ghost_level')).rejects.toThrow(/404/);
  });

  it('should_abort_and_throw_network_error_on_timeout', async () => {
    jest.useFakeTimers();
    try {
      // fetch que solo termina cuando su señal se aborta (simula servidor colgado)
      fetchMock.mockImplementationOnce(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () =>
              reject(new Error('The operation was aborted')),
            );
          }),
      );
      const client = new FetchLevelApiClient('http://localhost:3000', 50);

      const pending = client.fetchLevel('sample-level-2');
      const assertion = expect(pending).rejects.toThrow(NetworkError);
      jest.advanceTimersByTime(51);

      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});
