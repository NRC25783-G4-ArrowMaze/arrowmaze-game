/**
 * aliasFromEmail — Deriva el alias de badge a partir de un email. Función PURA
 * de presentación (solo display): el email es dato que el propio usuario tecleó.
 *
 * Reglas: recorta espacios; con `@` toma la parte local TAL CUAL se tecleó (sin
 * normalizar mayúsculas); sin `@` devuelve la cadena completa (best-effort);
 * vacío o solo espacios → '' (el componente del botón decide caer al label i18n;
 * el fallback es del render, no de esta función).
 */
export function aliasFromEmail(email: string): string {
  const trimmed = email.trim();
  if (trimmed === '') {
    return '';
  }
  return trimmed.split('@')[0].trim();
}
