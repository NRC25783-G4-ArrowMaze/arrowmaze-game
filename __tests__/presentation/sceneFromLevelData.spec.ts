import {
  DEFAULT_ARROW_PALETTE,
  sceneFromLevelData,
  toLevelDataDTO,
} from '../../src/presentation/game/scene';
import { SAMPLE_LEVEL_2 } from '../../src/presentation/game/sampleLevel2';
import type { LevelDataDTO } from '../../src/application/dtos/LevelDataDTOs';

describe('sceneFromLevelData', () => {
  const makeDTO = (overrides: Partial<LevelDataDTO> = {}): LevelDataDTO => ({
    id: 'lvl-test',
    allowedMoves: 10,
    cells: [
      { id: '4,2', portCount: 4 },
      { id: '5,2', portCount: 4 },
    ],
    connections: [{ fromCell: '4,2', fromPort: 1, toCell: '5,2', toPort: 3 }],
    arrows: [
      { id: 'a1', head: { cellId: '4,2', exitPort: 1 }, body: ['5,2'] },
      { id: 'a2', head: { cellId: '5,2', exitPort: 1 }, body: [] },
    ],
    ...overrides,
  });

  it('should_rebuild_col_row_from_cell_ids', () => {
    const scene = sceneFromLevelData(makeDTO());

    expect(scene.cells[0]).toEqual({ id: '4,2', col: 4, row: 2, portCount: 4 });
    expect(scene.cells[1]).toEqual({ id: '5,2', col: 5, row: 2, portCount: 4 });
  });

  it('should_assign_palette_colors_by_arrow_order', () => {
    const palette = ['#111111', '#222222'];
    const dto = makeDTO({
      arrows: [
        { id: 'a1', head: { cellId: '4,2', exitPort: 1 }, body: [] },
        { id: 'a2', head: { cellId: '5,2', exitPort: 1 }, body: [] },
        { id: 'a3', head: { cellId: '4,2', exitPort: 0 }, body: [] },
      ],
    });

    const scene = sceneFromLevelData(dto, palette);

    // Índice módulo paleta: a3 vuelve a empezar.
    expect(scene.arrows.map((a) => a.color)).toEqual(['#111111', '#222222', '#111111']);
  });

  it('should_roundtrip_with_toLevelDataDTO', () => {
    // Garantiza que sceneFromLevelData es inversa fiel de la proyección:
    // lo que el backend sirve (proyección de SAMPLE_LEVEL_2) reconstruye una
    // Scene que proyecta al mismo DTO.
    const dto = toLevelDataDTO(SAMPLE_LEVEL_2);

    const rebuilt = sceneFromLevelData(dto);

    expect(toLevelDataDTO(rebuilt)).toEqual(dto);
  });

  it('should_render_sample_level_2_with_its_original_colors', () => {
    // La paleta por defecto replica los colores de SAMPLE_LEVEL_2 en orden.
    const rebuilt = sceneFromLevelData(toLevelDataDTO(SAMPLE_LEVEL_2));

    expect(rebuilt.arrows.map((a) => a.color)).toEqual(
      SAMPLE_LEVEL_2.arrows.map((a) => a.color),
    );
    expect(DEFAULT_ARROW_PALETTE).toHaveLength(8);
  });

  it('should_default_connections_to_empty_array_when_missing', () => {
    const dto = makeDTO();
    delete (dto as Partial<LevelDataDTO>).connections;

    const scene = sceneFromLevelData(dto);

    expect(scene.connections).toEqual([]);
  });

  it('should_throw_on_malformed_cell_id', () => {
    const dto = makeDTO({ cells: [{ id: 'C1', portCount: 4 }] });

    expect(() => sceneFromLevelData(dto)).toThrow(/id de celda sin posición/);
  });
});
