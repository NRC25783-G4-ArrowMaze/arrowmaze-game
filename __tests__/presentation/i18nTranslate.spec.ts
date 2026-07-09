import { translate, CATALOGS, type Catalog } from '../../src/presentation/i18n/i18n';

describe('i18n — traducción, fallback e interpolación', () => {
  describe('Rule: fallback a inglés cuando falta la clave (D4)', () => {
    it('una clave ausente en "es" se muestra con el valor en "en"', () => {
      // Simula el escenario del spec quitando temporalmente una clave de "es".
      const original = (CATALOGS.es.settings as Catalog).audio;
      delete (CATALOGS.es.settings as Catalog).audio;
      try {
        expect(translate('es', 'settings.audio.title')).toBe('Audio'); // valor de EN
      } finally {
        (CATALOGS.es.settings as Catalog).audio = original;
      }
    });

    it('nunca muestra la clave literal si existe en algún catálogo', () => {
      expect(translate('es', 'overlay.victory.nextLevel')).toBe('Siguiente nivel →');
      expect(translate('en', 'overlay.victory.nextLevel')).toBe('Next level →');
    });

    it('devuelve la clave como último recurso solo si no existe en ningún idioma', () => {
      expect(translate('es', 'clave.inexistente.total')).toBe('clave.inexistente.total');
    });
  });

  describe('Rule: los textos dinámicos usan claves con parámetros', () => {
    it('interpola el número de movimientos en la plantilla del idioma activo', () => {
      expect(translate('es', 'game.movesLeft', { count: 5 })).toBe('Movimientos restantes: 5');
      expect(translate('en', 'game.movesLeft', { count: 5 })).toBe('Moves left: 5');
    });

    it('interpola el puntaje sin concatenación manual', () => {
      expect(translate('es', 'common.score', { score: 1200 })).toBe('Puntaje: 1200');
      expect(translate('en', 'common.score', { score: 1200 })).toBe('Score: 1200');
    });

    it('deja el marcador intacto si falta el parámetro', () => {
      expect(translate('es', 'game.movesLeft')).toBe('Movimientos restantes: {count}');
    });
  });

  it('difícil/dificultad se traduce por clave semántica (UI, no contenido)', () => {
    expect(translate('es', 'level.difficulty.veryHard')).toBe('Muy difícil');
    expect(translate('en', 'level.difficulty.veryHard')).toBe('Very hard');
  });
});
