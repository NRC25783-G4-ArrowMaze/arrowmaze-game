import {
  computeBoardLayout,
  cellCenter,
  screenToCell,
} from '../../src/presentation/rendering/boardLayout';
import { resolveTap, decideTap } from '../../src/presentation/input/tapResolver';
import { GameController } from '../../src/presentation/game/GameController';
import { SAMPLE_LEVEL } from '../../src/presentation/game/sampleLevel';
import type { ArrowView } from '../../src/presentation/viewModel';

const byId = (id: string) => (a: ArrowView): boolean => a.id === id;

const SIZE = 420;

describe('B3 — inversión coordenada → celda → flecha', () => {
  const layout = computeBoardLayout(SAMPLE_LEVEL.cells, SIZE, SIZE);

  it('screenToCell es la inversa exacta de cellCenter', () => {
    const center = cellCenter(4, 2, layout.cellSize, layout.offset);
    expect(screenToCell(center, layout.cellSize, layout.offset, 5, 5)).toEqual({
      col: 4,
      row: 2,
    });
  });

  it('un tap fuera del tablero no resuelve celda', () => {
    expect(screenToCell({ x: -100, y: -100 }, layout.cellSize, layout.offset, 5, 5)).toBeNull();
  });

  it('un tap sobre la cabeza de "blue" emite exactamente un comando con su id', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const center = cellCenter(4, 2, layout.cellSize, layout.offset); // cabeza de blue
    const command = resolveTap(center, layout, (c, r) =>
      controller.resolveArrowIdAt(c, r),
    );
    expect(command).toEqual({ arrowId: 'blue' });
  });

  it('un tap sobre celda vacía no emite comando', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const empty = cellCenter(0, 0, layout.cellSize, layout.offset);
    const command = resolveTap(empty, layout, (c, r) =>
      controller.resolveArrowIdAt(c, r),
    );
    expect(command).toBeNull();
  });
});

describe('B3 — un toque ejecuta UN tick y mueve la flecha una celda', () => {
  it('tocar "blue" la avanza de (4,2) a (4,1)', () => {
    const controller = new GameController(SAMPLE_LEVEL);

    const before = controller.viewModel().arrows.find(byId('blue'));
    expect(before?.cellIds[0]).toBe('4,2');

    const result = controller.playMove({ arrowId: 'blue' });

    expect(result?.success).toBe(true);
    expect(result?.outcome).toBe('advanced');
    expect(result?.movesRemaining).toBe(SAMPLE_LEVEL.allowedMoves - 1);

    const after = controller.viewModel().arrows.find(byId('blue'));
    expect(after?.cellIds[0]).toBe('4,1'); // cabeza avanzó una celda al Norte
    expect(after?.cellIds.length).toBe(2); // sigue midiendo 2 (avanzó cabeza, liberó cola)
  });

  it('tocar "green" queda bloqueada por "orange" (estado sin cambios)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const before = controller.viewModel().arrows.find(byId('green'));

    const result = controller.playMove({ arrowId: 'green' });

    expect(result?.outcome).toBe('blocked');
    const after = controller.viewModel().arrows.find(byId('green'));
    expect(after?.cellIds).toEqual(before?.cellIds); // nada se movió
  });
});

describe('B3 — gating del input (decideTap)', () => {
  const controller = new GameController(SAMPLE_LEVEL);
  const layout = computeBoardLayout(SAMPLE_LEVEL.cells, SIZE, SIZE);
  const onHead = cellCenter(4, 2, layout.cellSize, layout.offset); // cabeza de blue
  const resolver = (c: number, r: number): string | null =>
    controller.resolveArrowIdAt(c, r);
  const primary = { button: 0, isPrimary: true };

  it('input habilitado + pointer primario sobre flecha → emite comando', () => {
    expect(decideTap(true, primary, onHead, layout, resolver)).toEqual({
      arrowId: 'blue',
    });
  });

  it('input deshabilitado (en vuelo / terminal) → descarta (null)', () => {
    expect(decideTap(false, primary, onHead, layout, resolver)).toBeNull();
  });

  it('click derecho (button !== 0) → ignora', () => {
    expect(
      decideTap(true, { button: 2, isPrimary: true }, onHead, layout, resolver),
    ).toBeNull();
  });

  it('pointer secundario (multi-touch) → ignora', () => {
    expect(
      decideTap(true, { button: 0, isPrimary: false }, onHead, layout, resolver),
    ).toBeNull();
  });
});
