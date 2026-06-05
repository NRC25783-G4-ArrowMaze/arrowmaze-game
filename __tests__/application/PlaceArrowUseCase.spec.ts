import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { PlaceArrowUseCase } from '../../src/application/use-cases/PlaceArrowUseCase';

describe('PlaceArrowUseCase — capa de aplicación', () => {

  // Helper: tablero con C1 y C2 conectadas (puerto 1<->3). C3 existe pero NO conecta.
  function buildBoard() {
    const C1 = new Cell('C1', 4);
    const C2 = new Cell('C2', 4);
    const C3 = new Cell('C3', 4);
    const board = new Board('B');
    [C1, C2, C3].forEach(c => board.addCell(c));
    board.connectPorts(C1, 1, C2, 3);
    return { board, C1, C2, C3 };
  }

  describe('Happy path', () => {
    it('coloca head + cuerpo y devuelve success con los segmentos proyectados', () => {
      const { board, C1, C2 } = buildBoard();
      const uc = new PlaceArrowUseCase();

      const res = uc.execute({ board, headCellId: 'C1', exitPort: 1, bodyCellIds: ['C2'] });

      expect(res.success).toBe(true);
      expect(res.arrowLength).toBe(2);
      expect(res.segments).toHaveLength(2);
      expect(C1.isOccupied()).toBe(true);
      expect(C2.isOccupied()).toBe(true);
    });
  });

  describe('Rollback ante fallo', () => {
    it('si una celda del cuerpo no conecta, NO deja celdas ocupadas (estado limpio)', () => {
      const { board, C1, C2, C3 } = buildBoard();
      const uc = new PlaceArrowUseCase();

      // C3 no conecta con C2 -> extend(C3) lanza -> debe hacer rollback
      const res = uc.execute({ board, headCellId: 'C1', exitPort: 1, bodyCellIds: ['C2', 'C3'] });

      expect(res.success).toBe(false);
      // Lo crítico: el tablero NO quedó sucio
      expect(C1.isOccupied()).toBe(false);
      expect(C2.isOccupied()).toBe(false);
      expect(C3.isOccupied()).toBe(false);
    });

    it('si una celda del cuerpo no existe en el board, también limpia', () => {
      const { board, C1, C2 } = buildBoard();
      const uc = new PlaceArrowUseCase();

      const res = uc.execute({ board, headCellId: 'C1', exitPort: 1, bodyCellIds: ['C2', 'NO_EXISTE'] });

      expect(res.success).toBe(false);
      expect(C1.isOccupied()).toBe(false);
      expect(C2.isOccupied()).toBe(false);
    });
  });

  describe('Head inexistente', () => {
    it('devuelve fallo sin reventar si la celda del head no está en el board', () => {
      const { board } = buildBoard();
      const uc = new PlaceArrowUseCase();

      const res = uc.execute({ board, headCellId: 'NO_EXISTE', exitPort: 1 });

      expect(res.success).toBe(false);
      expect(res.arrowLength).toBe(0);
    });
  });

});