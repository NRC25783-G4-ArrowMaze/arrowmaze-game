import { firstTapTarget } from '../../src/presentation/input/tapOcclusion';

/**
 * MODO CUBO — oclusión del tap (ajuste 4): solo se juega lo que se ve.
 * El primer impacto del raycast (ordenado por distancia) decide.
 */
describe('firstTapTarget', () => {
  it('flecha visible delante del cubo → se juega', () => {
    expect(firstTapTarget([{ arrowId: 'roja' }, { arrowId: null }])).toBe('roja');
  });

  it('flecha DETRÁS de la geometría del cubo → ocluida, el tap se ignora', () => {
    expect(firstTapTarget([{ arrowId: null }, { arrowId: 'roja' }])).toBeNull();
  });

  it('sin impactos → nada que jugar', () => {
    expect(firstTapTarget([])).toBeNull();
  });

  it('dos flechas alineadas: gana la más cercana a cámara', () => {
    expect(firstTapTarget([{ arrowId: 'azul' }, { arrowId: 'verde' }])).toBe('azul');
  });
});
