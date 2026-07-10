import { aliasFromEmail } from '../../src/presentation/account/aliasFromEmail';

/**
 * aliasFromEmail — función PURA: deriva el alias de badge de un email.
 * Reglas (selladas): trim primero · con @ → parte local TAL CUAL (sin lowercase)
 * · sin @ → la cadena completa · vacío o solo espacios → '' (el botón decide el
 * fallback al label i18n, no la función).
 */
describe('aliasFromEmail', () => {
  it('email normal → parte local antes del @', () => {
    expect(aliasFromEmail('juan@arrowmaze.com')).toBe('juan');
  });

  it('preserva el caso tecleado (sin lowercase)', () => {
    expect(aliasFromEmail('JUAN@x.com')).toBe('JUAN');
    expect(aliasFromEmail('John.Doe@x.com')).toBe('John.Doe');
  });

  it('recorta espacios alrededor', () => {
    expect(aliasFromEmail('  juan@x.com  ')).toBe('juan');
  });

  it('sin @ → la cadena completa (best-effort)', () => {
    expect(aliasFromEmail('juanito')).toBe('juanito');
  });

  it('vacío o solo espacios → cadena vacía (el botón cae al label)', () => {
    expect(aliasFromEmail('')).toBe('');
    expect(aliasFromEmail('   ')).toBe('');
  });

  it('local vacío (@dominio) → cadena vacía', () => {
    expect(aliasFromEmail('@x.com')).toBe('');
  });
});
