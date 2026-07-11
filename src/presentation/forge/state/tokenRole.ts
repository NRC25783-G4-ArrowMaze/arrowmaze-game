/**
 * Decodifica el claim `role` de un JWT sin verificar la firma.
 *
 * Es SOLO para decidir qué mostrar en la UI del editor (gatear la opción de
 * administración). La autorización real la impone el backend en cada endpoint
 * protegido (RBAC ADMIN sobre POST/PUT /levels): un token manipulado en el
 * cliente no concede permisos reales, solo pinta botones que el servidor
 * rechazaría con 403.
 */
export function roleFromToken(token: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    // base64url → base64 → JSON del payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    const payload = JSON.parse(json) as { role?: unknown }
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

/** True si el token corresponde a un administrador (claim role === 'ADMIN'). */
export function isAdminToken(token: string | null): boolean {
  return roleFromToken(token) === 'ADMIN'
}
