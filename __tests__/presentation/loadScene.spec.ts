import { fetchSceneWithFallback } from '../../src/presentation/game/loadScene';
import { toLevelDataDTO } from '../../src/presentation/game/scene';
import { SAMPLE_LEVEL_2 } from '../../src/presentation/game/sampleLevel2';
import type { ILevelApiClient } from '../../src/application/ports/ILevelApiClient';
import type { LevelDataDTO } from '../../src/application/dtos/LevelDataDTOs';
import { NetworkError } from '../../src/domain/errors/SyncErrors';

describe('fetchSceneWithFallback', () => {
  const clientReturning = (dto: LevelDataDTO): ILevelApiClient => ({
    fetchLevel: jest.fn().mockResolvedValue(dto),
  });

  const clientFailing = (): ILevelApiClient => ({
    fetchLevel: jest.fn().mockRejectedValue(new NetworkError('backend caído')),
  });

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should_return_remote_scene_when_fetch_succeeds', async () => {
    const remoteDto = { ...toLevelDataDTO(SAMPLE_LEVEL_2), allowedMoves: 20 };
    const client = clientReturning(remoteDto);

    const scene = await fetchSceneWithFallback(client, SAMPLE_LEVEL_2.id, SAMPLE_LEVEL_2);

    expect(client.fetchLevel).toHaveBeenCalledWith(SAMPLE_LEVEL_2.id);
    expect(scene.allowedMoves).toBe(20); // vino de la API, no del fallback
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should_return_local_fallback_when_fetch_fails', async () => {
    const scene = await fetchSceneWithFallback(clientFailing(), SAMPLE_LEVEL_2.id, SAMPLE_LEVEL_2);

    expect(scene).toBe(SAMPLE_LEVEL_2);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should_return_fallback_when_remote_payload_is_malformed', async () => {
    // Celda cuyo id no codifica posición "col,row": sceneFromLevelData lanza.
    const malformed: LevelDataDTO = {
      id: 'bad-level',
      allowedMoves: 5,
      cells: [{ id: 'C1', portCount: 4 }],
      connections: [],
      arrows: [{ id: 'a1', head: { cellId: 'C1', exitPort: 0 }, body: [] }],
    };

    const scene = await fetchSceneWithFallback(clientReturning(malformed), 'bad-level', SAMPLE_LEVEL_2);

    expect(scene).toBe(SAMPLE_LEVEL_2);
    expect(warnSpy).toHaveBeenCalled();
  });
});
