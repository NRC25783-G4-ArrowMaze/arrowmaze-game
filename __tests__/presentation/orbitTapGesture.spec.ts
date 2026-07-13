import { OrbitTapGesture, DEFAULT_GESTURE_CONFIG } from '../../src/presentation/input/orbitTapGesture';

/**
 * MODO CUBO — umbral tap/drag (8px / 200ms) del diseño aprobado:
 * superado CUALQUIERA de los dos umbrales, el pointerup no es jugada.
 */
describe('OrbitTapGesture — separación tap vs drag', () => {
  it('la config por defecto es la del diseño: 8px / 200ms', () => {
    expect(DEFAULT_GESTURE_CONFIG).toEqual({ tapMaxDistancePx: 8, tapMaxDurationMs: 200 });
  });

  it('tap limpio: down→up rápido y sin moverse emite tap', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    expect(g.pointerUp(102, 101, 1120)).toEqual({ type: 'tap', x: 102, y: 101 });
  });

  it('presión larga (>200ms) sin movimiento NO es tap', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    expect(g.pointerUp(100, 100, 1350)).toBeNull();
  });

  it('micro-movimientos bajo el umbral no disparan orbit y el up sigue siendo tap', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    expect(g.pointerMove(104, 103)).toBeNull();
    expect(g.pointerMove(101, 99)).toBeNull();
    expect(g.isDragging).toBe(false);
    expect(g.pointerUp(101, 99, 1150)).toEqual({ type: 'tap', x: 101, y: 99 });
  });

  it('superar 8px engancha el drag: el primer orbit trae el delta acumulado', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    expect(g.pointerMove(112, 100)).toEqual({ type: 'orbit', dx: 12, dy: 0 });
    expect(g.isDragging).toBe(true);
    // Los siguientes movimientos emiten deltas incrementales.
    expect(g.pointerMove(115, 102)).toEqual({ type: 'orbit', dx: 3, dy: 2 });
  });

  it('tras un drag, el pointerup se ignora como jugada aunque vuelva al origen', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    g.pointerMove(150, 130);
    g.pointerMove(100, 100); // vuelve exactamente al punto de partida
    expect(g.pointerUp(100, 100, 1100)).toBeNull();
    expect(g.isDown).toBe(false);
  });

  it('up desplazado >8px sin move previo tampoco es tap (drag no registrado)', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    expect(g.pointerUp(120, 100, 1100)).toBeNull();
  });

  it('move/up sin down previo no emiten nada', () => {
    const g = new OrbitTapGesture();
    expect(g.pointerMove(10, 10)).toBeNull();
    expect(g.pointerUp(10, 10, 100)).toBeNull();
  });

  it('cancel() aborta el gesto en curso', () => {
    const g = new OrbitTapGesture();
    g.pointerDown(100, 100, 1000);
    g.cancel();
    expect(g.isDown).toBe(false);
    expect(g.pointerUp(100, 100, 1050)).toBeNull();
  });
});
