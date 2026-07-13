import { GameController } from '../../src/presentation/game/GameController';
import { LOCAL_LEVELS } from '../../src/presentation/game/levels/localLevels';
import {
  LEVEL_EL_HUECO,
  EL_HUECO_SOLVE_ORDER,
} from '../../src/presentation/game/levels/levelElHueco';
import { SINGULARIDAD_SOLVE_ORDER } from '../../src/presentation/game/levels/levelSingularidad';
import { LEVEL_MAP } from '../../src/presentation/game/levelMap';
import type { Scene } from '../../src/presentation/game/scene';

/**
 * Catálogo de niveles locales (distribuible offline) — contrato con el mapa C3
 * y resolubilidad real de cada nivel.
 *
 * La resolubilidad no se afirma en abstracto: se JUEGA cada nivel con el motor
 * (GameController: advanceTick en bucle + commitSlide, la misma consolidación
 * "1 tap = 1 jugada" de la UI) siguiendo un orden de taps conocido, y se exige
 * que cada tap termine en 'destroyed' y la sesión en WON dentro del presupuesto.
 */

/** Orden de resolución conocido de cada nivel (un tap por flecha, sin bloqueos). */
const SOLVE_ORDERS: Record<string, string[]> = {
  // Azul y naranja escapan libres; verde necesita que naranja libere (2,2).
  'level-initial': ['blue', 'orange', 'green'],
  // Teselado de sample-level-2: primero los que escapan por el borde S.
  'level-intermediate-a': ['cyan', 'rose', 'orange', 'magenta', 'violet', 'green', 'amber', 'blue'],
  // NOTA: 'heart-preview' (corazón de 13 flechas del FORGE, último nivel) NO se
  // lista aquí a propósito — es un nivel-vitrina con forma de icono cuyo orden de
  // resolución no está cerrado. El test de "carga sin errores" sí lo cubre.
  // Oleadas por fila: el bloque del lado de escape libera a sus vecinos.
  'level-intermediate-b': [
    'top-right', 'top-mid', 'top-left',
    'mid-left', 'mid-mid', 'mid-right',
    'bottom-right', 'bottom-mid', 'bottom-left',
  ],
  // Molinete roto: left es la llave; el perímetro cae en cadena y las filas
  // interiores salen por el lado ya liberado.
  'level-advanced': ['left', 'row-2', 'row-4', 'bottom', 'right', 'row-1', 'row-3', 'top'],
  // Molinetes anidados: anillo exterior → anillo interior → núcleo.
  'level-expert': [
    'outer-left', 'outer-bottom', 'outer-right', 'inner-left', 'inner-bottom',
    'core-hook', 'inner-right', 'core-tail', 'inner-top', 'outer-top',
  ],
  // Mapas 6-15 (borradores para el FORGE, tamaño progresivo 16→25):
  // órdenes calculados por el validador de pelado del generador y
  // confirmados aquí con el motor.
  // Las llaves centrales liberan los peines de ambas mitades.
  'mapa-06': [
    'llave-alta', 'llave-baja', 'este-2', 'este-4', 'este-6', 'este-8',
    'este-10', 'este-12', 'oeste-3', 'oeste-5', 'oeste-7', 'oeste-9',
    'oeste-11', 'oeste-13',
  ],
  // Seis anillos molinete de fuera hacia dentro y núcleo 5×5 al final.
  'mapa-07': [
    'anillo0-left', 'anillo0-bottom', 'anillo0-right', 'anillo0-top',
    'anillo1-left', 'anillo1-bottom', 'anillo1-right', 'anillo1-top',
    'anillo2-left', 'anillo2-bottom', 'anillo2-right', 'anillo2-top',
    'anillo3-left', 'anillo3-bottom', 'anillo3-right', 'anillo3-top',
    'anillo4-left', 'anillo4-bottom', 'anillo4-right', 'anillo4-top',
    'anillo5-left', 'anillo5-bottom', 'anillo5-right', 'anillo5-top',
    'nucleo-a', 'nucleo-b', 'nucleo-c', 'nucleo-d', 'nucleo-e',
  ],
  // Peines → remontes (en cadena) → escaleras.
  'mapa-08': [
    'peine-6', 'peine-8', 'peine-10', 'peine-12', 'peine-14', 'escalera-0',
    'escalera-1', 'remonte-3', 'escalera-2', 'escalera-3', 'remonte-2',
    'escalera-4', 'remonte-1', 'escalera-5', 'escalera-6', 'remonte-0',
    'escalera-7',
  ],
  // Los cuadrantes del sur liberan los corredores de los del norte.
  'mapa-09': [
    'q2-left', 'q2-bottom', 'q2-right', 'q3-left', 'q3-bottom', 'q3-right',
    'q3-top', 'q3-int-a', 'q3-int-b', 'q1-left', 'q2-top', 'q2-int-a',
    'q2-int-b', 'q0-left', 'q0-bottom', 'q0-right', 'q1-bottom', 'q1-right',
    'q1-top', 'q1-int-a', 'q1-int-b', 'q0-top', 'q0-int-a', 'q0-int-b',
  ],
  // Rombo: espinas por el vértice sur, alas este directas, alas oeste después.
  'mapa-10': [
    'espina-baja', 'espina-alta', 'ala-este-2', 'ala-este-3', 'ala-oeste-3',
    'ala-este-4', 'ala-oeste-4', 'ala-este-5', 'ala-oeste-5', 'ala-este-6',
    'ala-oeste-6', 'ala-este-7', 'ala-oeste-7', 'ala-este-8', 'ala-oeste-8',
    'ala-este-9', 'ala-oeste-9', 'ala-este-10', 'ala-oeste-10', 'ala-este-11',
    'ala-oeste-11', 'ala-este-12', 'ala-oeste-12', 'ala-este-13',
    'ala-oeste-13', 'ala-este-14', 'ala-oeste-14', 'ala-este-15',
    'ala-oeste-15', 'ala-este-16', 'ala-oeste-16', 'ala-este-17',
    'ala-oeste-17', 'ala-este-18',
  ],
  // El bloque SE libera los cerrojos que sellan el molinete NO.
  'mapa-11': [
    'no0-left', 'no0-bottom', 'no0-right', 'se0-left', 'se0-bottom',
    'se0-right', 'se0-top', 'se1-left', 'se1-bottom', 'se1-right', 'se1-top',
    'se2-left', 'se2-bottom', 'se2-right', 'se2-top', 'se-nucleo-a',
    'se-nucleo-b', 'cerrojo-ne', 'cerrojo-so', 'cerrojo-so2', 'no0-top',
    'no1-left', 'no1-bottom', 'no1-right', 'no1-top', 'no2-left',
    'no2-bottom', 'no2-right', 'no2-top', 'no-nucleo-a', 'no-nucleo-b',
  ],
  // Espiral: cada vuelta desbloquea la siguiente hacia el centro.
  'mapa-12': [
    'giro-3', 'giro-2', 'giro-1', 'giro-0', 'giro-7', 'giro-6', 'giro-5',
    'giro-4', 'giro-11', 'giro-10', 'giro-9', 'giro-8', 'giro-15',
    'centro-b', 'giro-14', 'giro-13', 'giro-12', 'giro-19', 'giro-18',
    'giro-17', 'centro-a', 'giro-16',
  ],
  // Capas: topes/contras → barras → pestillos.
  'mapa-13': [
    'barra-18', 'barra-19', 'barra-20', 'barra-21', 'contra-19', 'contra-20',
    'contra-21', 'tope-a', 'tope-b', 'tope-c', 'contra-12', 'contra-13',
    'contra-14', 'contra-15', 'contra-16', 'contra-17', 'contra-18',
    'barra-12', 'barra-13', 'barra-14', 'barra-15', 'barra-16', 'barra-17',
    'pestillo-1', 'pestillo-2', 'pestillo-3', 'pestillo-4', 'pestillo-5',
    'pestillo-6', 'pestillo-7', 'pestillo-8', 'pestillo-9', 'pestillo-10',
  ],
  // Muros de fuera hacia dentro, contramuros invertidos, muros interiores
  // y sellos del núcleo.
  'mapa-14': [
    'muro0-left', 'muro0-bottom', 'muro0-right', 'muro0-top', 'muro1-left',
    'muro1-bottom', 'muro1-right', 'muro1-top', 'muro2-left', 'muro2-bottom',
    'muro2-right', 'muro2-top', 'contra3-top', 'contra3-right',
    'contra3-bottom', 'contra4-right', 'contra4-bottom', 'contra5-bottom',
    'muro6-left', 'contra3-left', 'contra4-top', 'contra5-right',
    'contra4-left', 'contra5-top', 'contra5-left', 'muro6-bottom',
    'muro6-right', 'muro6-top', 'muro7-left', 'muro7-bottom', 'muro7-right',
    'muro7-top', 'sello-a', 'sello-b', 'sello-e', 'sello-c', 'sello-d',
  ],
  // SINGULARIDAD (MODO CUBO, gran final): ola 1 vacía los carriles directos
  // al agujero negro; la ola 2 los recorre desde las caras profundas.
  'singularidad': SINGULARIDAD_SOLVE_ORDER,
  // Anillo: circulaciones, radiales hacia el hueco, carriles y esquinas.
  'mapa-15': [
    'borde-left', 'borde-bottom', 'borde-right', 'borde-top', 'brocal-left',
    'brocal-bottom', 'brocal-right', 'brocal-top', 'radial-n10', 'radial-s10',
    'radial-n14', 'radial-s14', 'radial-o10', 'radial-e10', 'radial-o14',
    'radial-e14', 'esquina-so', 'carril-o', 'carril-n', 'carril-e',
    'carril-s', 'esquina-no', 'esquina-ne', 'esquina-se',
  ],
};

/** Desliza una flecha hasta su outcome terminal y consolida la jugada (como la UI). */
function slide(controller: GameController, arrowId: string): string | null {
  const maxTicks = 200; // cota defensiva anti-bucle
  let outcome = controller.advanceTick(arrowId);
  for (let tick = 0; outcome === 'advanced' && tick < maxTicks; tick++) {
    outcome = controller.advanceTick(arrowId);
  }
  if (outcome !== null) {
    controller.commitSlide(outcome);
  }
  return outcome;
}

describe('Catálogo de niveles locales (offline)', () => {
  it('cubre exactamente los levelId del LEVEL_MAP y cada Scene lleva ese id', () => {
    const mapIds = LEVEL_MAP.map((n) => n.levelId).sort();
    const catalogIds = Object.keys(LOCAL_LEVELS).sort();
    expect(catalogIds).toEqual(mapIds);

    for (const [levelId, scene] of Object.entries(LOCAL_LEVELS)) {
      // scene.id === levelId es lo que enlaza el progreso (D1) con el desbloqueo (C3).
      expect(scene.id).toBe(levelId);
    }
  });

  it('cada nivel carga en el motor sin errores de topología ni solapes', () => {
    for (const scene of Object.values(LOCAL_LEVELS)) {
      // El constructor valida vía LevelLoader (conectividad, ocupación, colisiones).
      expect(() => new GameController(scene as Scene)).not.toThrow();
    }
  });

  describe.each(Object.entries(SOLVE_ORDERS))('nivel %s', (levelId, order) => {
    it('es resoluble con un tap por flecha dentro del presupuesto', () => {
      const scene = LOCAL_LEVELS[levelId];
      expect(scene.arrows.map((a) => a.id).sort()).toEqual([...order].sort());
      expect(order.length).toBeLessThanOrEqual(scene.allowedMoves);

      const controller = new GameController(scene);
      for (const arrowId of order) {
        const outcome = slide(controller, arrowId);
        // Si esto falla, el orden de escape del nivel está mal diseñado.
        expect({ arrowId, outcome }).toEqual({ arrowId, outcome: 'destroyed' });
      }

      expect(controller.status).toBe('WON');
      expect(controller.score).not.toBeNull();
    });
  });
});

describe('SINGULARIDAD — umbrales de estrellas MEDIDOS (metodología: el flawless real del motor)', () => {
  it('los starThresholds del mapa quedan por debajo del flawless del SOLVE_ORDER y en orden', () => {
    const controller = new GameController(LOCAL_LEVELS['singularidad']);
    for (const arrowId of SINGULARIDAD_SOLVE_ORDER) {
      slide(controller, arrowId);
    }
    expect(controller.status).toBe('WON');
    const flawless = controller.score;
    expect(flawless).not.toBeNull();
    // eslint-disable-next-line no-console
    console.log(`[SINGULARIDAD] score flawless medido: ${flawless}`);

    const node = LEVEL_MAP.find((n) => n.levelId === 'singularidad');
    expect(node).toBeDefined();
    const [twoStars, threeStars] = node!.starThresholds;
    // Umbrales crecientes, ALCANZABLES con el flawless (3ª estrella incluida),
    // y exigentes (la 2ª no regalada: ≥80% del flawless).
    expect(twoStars).toBeLessThan(threeStars);
    expect(threeStars).toBeLessThanOrEqual(flawless!);
    expect(twoStars).toBeGreaterThanOrEqual(Math.floor(flawless! * 0.8));
  });
});

describe('EL HUECO — nivel showcase del MODO CUBO (preview, fuera del mapa C3)', () => {
  it('carga en el motor real sin errores de topología ni solapes', () => {
    expect(() => new GameController(LEVEL_EL_HUECO)).not.toThrow();
  });

  it('la secuencia ganadora cubre exactamente sus flechas dentro del presupuesto', () => {
    expect(LEVEL_EL_HUECO.arrows.map((a) => a.id).sort()).toEqual(
      [...EL_HUECO_SOLVE_ORDER].sort(),
    );
    expect(EL_HUECO_SOLVE_ORDER.length).toBeLessThanOrEqual(LEVEL_EL_HUECO.allowedMoves);
  });

  it('es resoluble con un tap por flecha: todas devoradas por el agujero y WON', () => {
    const controller = new GameController(LEVEL_EL_HUECO);
    for (const arrowId of EL_HUECO_SOLVE_ORDER) {
      const outcome = slide(controller, arrowId);
      // Si esto falla, la secuencia ganadora del showcase está mal diseñada.
      expect({ arrowId, outcome }).toEqual({ arrowId, outcome: 'destroyed' });
    }
    expect(controller.status).toBe('WON');
    expect(controller.score).not.toBeNull();
  });
});
