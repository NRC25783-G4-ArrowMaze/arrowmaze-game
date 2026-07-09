import { isValidEmail, validatePassword } from '../../src/application/services/credentialPolicy';

// Política E1 (literal):
//   email    → formato RFC 5322 válido
//   password → mínimo 8 caracteres, 1 número, 1 letra mayúscula

describe('credentialPolicy.isValidEmail', () => {
  it.each([
    'usuario@test.com',
    'nuevo@usuario.com',
    'a.b-c+tag@sub.dominio.co',
    'name_surname@example.org',
  ])('acepta email válido: %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    'usuario.test.com', // sin @ (escenario E1)
    'usuario@',
    '@dominio.com',
    'usuario@dominio',
    'espacio dentro@test.com',
    'dos@@arrobas.com',
    '',
  ])('rechaza email inválido: %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('credentialPolicy.validatePassword', () => {
  it.each([
    'Secreta123',
    'Password123',
    'Abcdefg9',
  ])('acepta password válido: %s', (pw) => {
    expect(validatePassword(pw)).toBe(true);
  });

  it('rechaza password de menos de 8 caracteres', () => {
    expect(validatePassword('Abc123')).toBe(false); // 6 chars
  });

  it('rechaza password sin número', () => {
    expect(validatePassword('SecretaAbc')).toBe(false);
  });

  it('rechaza password sin mayúscula', () => {
    expect(validatePassword('secreta123')).toBe(false);
  });

  it('rechaza "clave" (escenario E1: débil)', () => {
    expect(validatePassword('clave')).toBe(false);
  });
});
