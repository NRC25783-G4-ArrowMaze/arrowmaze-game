import { resolveInitialLanguage } from '../../src/presentation/i18n/i18n';

// Mapea la Rule "El idioma inicial se resuelve por preferencia guardada y,
// si no hay, por locale (D1, D2)" del spec G2.
describe('i18n — resolución del idioma inicial (D1, D2)', () => {
  describe('sin preferencia guardada → locale del dispositivo', () => {
    it('locale español (es-VE) → ES', () => {
      expect(resolveInitialLanguage(null, 'es-VE')).toBe('es');
    });

    it('locale inglés (en-US) → EN', () => {
      expect(resolveInitialLanguage(null, 'en-US')).toBe('en');
    });

    it.each(['fr-FR', 'pt-BR', 'de-DE'])('locale no soportado (%s) → EN', (locale) => {
      expect(resolveInitialLanguage(null, locale)).toBe('en');
    });
  });

  describe('la preferencia guardada prevalece sobre el locale (D2)', () => {
    it('preferencia "es" con locale "en-US" → ES', () => {
      expect(resolveInitialLanguage('es', 'en-US')).toBe('es');
    });

    it('preferencia "en" con locale "es-VE" → EN', () => {
      expect(resolveInitialLanguage('en', 'es-VE')).toBe('en');
    });

    it('una preferencia inválida se ignora y cae al locale', () => {
      expect(resolveInitialLanguage('xx', 'es-VE')).toBe('es');
      expect(resolveInitialLanguage('', 'en-US')).toBe('en');
    });
  });
});
