import { GetLevelLeaderboard } from '../../src/application/services/GetLevelLeaderboard';
import { type ILeaderboardApiClient } from '../../src/application/ports/ILeaderboardApiClient';
import type { LeaderboardResponse } from '../../src/application/dtos/LeaderboardDTOs';

describe('GetLevelLeaderboard Use Case', () => {
  const response: LeaderboardResponse = {
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

  it('pide el leaderboard del nivel al puerto y devuelve la respuesta tal cual', async () => {
    const apiClient: jest.Mocked<ILeaderboardApiClient> = {
      getByLevel: jest.fn().mockResolvedValue(response),
    };
    const useCase = new GetLevelLeaderboard(apiClient);

    const result = await useCase.execute('level-initial');

    expect(apiClient.getByLevel).toHaveBeenCalledWith('level-initial');
    expect(result).toBe(response);
  });

  it('propaga los errores del puerto sin tragárselos (la UI decide el estado)', async () => {
    const boom = new Error('network down');
    const apiClient: jest.Mocked<ILeaderboardApiClient> = {
      getByLevel: jest.fn().mockRejectedValue(boom),
    };
    const useCase = new GetLevelLeaderboard(apiClient);

    await expect(useCase.execute('level-initial')).rejects.toBe(boom);
  });
});
