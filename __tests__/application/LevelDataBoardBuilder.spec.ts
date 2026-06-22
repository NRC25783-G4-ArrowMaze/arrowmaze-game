import { LevelDataBoardBuilder } from '../../src/application/services/LevelDataBoardBuilder'
import { LevelDataDTO } from '../../src/infrastructure/shared/contracts/LevelDataDTOs';
import { LevelDataError, ConnectionError, BoardRegistryError, TopologyError } from '../../src/domain/errors/BoardErrors';

describe('LevelDataBoardBuilder', () => {
  let builder: LevelDataBoardBuilder;

  // Helper para generar un DTO válido base y mutarlo en las pruebas
  const getValidBaseDTO = (): LevelDataDTO => ({
    id: 'level_01',
    allowedMoves: 10,
    arrows: [{ id: 'arr1', head: { cellId: 'C1', exitPort: 1 }, body: [] }],
    cells: [
      { id: 'C1', portCount: 4 },
      { id: 'C2', portCount: 4 }
    ],
    connections: []
  });

  beforeEach(() => {
    builder = new LevelDataBoardBuilder();
  });

  // ─── BLOQUE 1: VALIDACIÓN DE CELDAS ────────────────────────────────────────

  it('should_return_board_with_cells_when_dto_is_valid_and_disconnected', () => {
    // Arrange
    const data = getValidBaseDTO();

    // Act
    const board = builder.build(data);

    // Assert
    expect(board.getId()).toBe('level_01');
    expect(board.getAllCells()).toHaveLength(2);
    expect(board.getCell('C1')?.isExit(0)).toBe(true); // Todos los puertos son salidas
  });

  it('should_throw_TopologyError_when_portCount_is_odd', () => {
    // Arrange
    const data = getValidBaseDTO();
    data.cells[0].portCount = 3;

    // Act & Assert
    expect(() => builder.build(data)).toThrow(TopologyError);
    expect(() => builder.build(data)).toThrow('port count must be an even number');
  });

  it('should_throw_BoardRegistryError_when_cell_ids_are_duplicated', () => {
    // Arrange
    const data = getValidBaseDTO();
    data.cells.push({ id: 'C1', portCount: 4 }); // C1 duplicado

    // Act & Assert
    expect(() => builder.build(data)).toThrow(BoardRegistryError);
    expect(() => builder.build(data)).toThrow('cell ID already exists in this board');
  });

  // ─── BLOQUE 2 & 7: TOPOLOGÍA Y PUERTOS OPUESTOS ────────────────────────────

  it('should_connect_cells_successfully_when_ports_are_opposite', () => {
    // Arrange
    const data = getValidBaseDTO();
    // C1(puerto 1) -> C2(puerto 3). Opuesto de 1 en una celda de 4 es (1 + 2) % 4 = 3. ✓
    data.connections = [{ fromCell: 'C1', fromPort: 1, toCell: 'C2', toPort: 3 }];

    // Act
    const board = builder.build(data);

    // Assert
    const c1 = board.getCell('C1')!;
    const c2 = board.getCell('C2')!;
    expect(c1.getConnection(1)).toEqual({ neighbor: c2, neighborPortIndex: 3 });
  });

  it('should_throw_ConnectionError_when_ports_are_not_opposite', () => {
    // Arrange
    const data = getValidBaseDTO();
    // C1(puerto 0) -> C2(puerto 1). Opuesto de 0 es 2. X
    data.connections = [{ fromCell: 'C1', fromPort: 0, toCell: 'C2', toPort: 1 }];

    // Act & Assert
    expect(() => builder.build(data)).toThrow(ConnectionError);
    expect(() => builder.build(data)).toThrow('ports must be opposite (expected 2, got 1)');
  });

  it('should_throw_ConnectionError_when_cell_connects_to_itself', () => {
    // Arrange
    const data = getValidBaseDTO();
    data.connections = [{ fromCell: 'C1', fromPort: 0, toCell: 'C1', toPort: 2 }];

    // Act & Assert
    expect(() => builder.build(data)).toThrow(ConnectionError);
    expect(() => builder.build(data)).toThrow('a cell cannot connect to itself');
  });

  // ─── BLOQUE 4: VALIDACIÓN DEL DTO (SPAWN/ARROWS) ───────────────────────────

  it('should_throw_LevelDataError_when_required_fields_are_missing', () => {
    // Arrange
    const data: Partial<LevelDataDTO> = getValidBaseDTO();
    delete data.allowedMoves;

    // Act & Assert
    expect(() => builder.build(data as LevelDataDTO)).toThrow(LevelDataError);
    expect(() => builder.build(data as LevelDataDTO)).toThrow("missing required field 'allowedMoves'");
  });

  it('should_throw_BoardRegistryError_when_arrow_head_references_ghost_cell', () => {
    // Arrange
    const data = getValidBaseDTO();
    data.arrows[0].head.cellId = 'GHOST_CELL';

    // Act & Assert
    expect(() => builder.build(data)).toThrow(BoardRegistryError);
    expect(() => builder.build(data)).toThrow('references non-existent cell "GHOST_CELL"');
  });
});