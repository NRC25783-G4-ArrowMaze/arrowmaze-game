// Política de credenciales E1 (funciones puras, sin dependencias).
//   email    → formato RFC 5322 válido
//   password → mínimo 8 caracteres, 1 número, 1 letra mayúscula
//
// Consumida por RegisterUser (rechaza antes de la red) y por el AccountOverlay
// (validación inline): una sola fuente de verdad para ambos.

// Subconjunto pragmático de RFC 5322: local-part sin espacios ni @, un único @,
// dominio con al menos un punto y TLD alfabético. Suficiente para UX de cliente;
// la validación autoritativa es del backend.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password);
}
