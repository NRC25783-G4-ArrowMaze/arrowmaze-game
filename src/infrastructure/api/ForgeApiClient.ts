import type { LevelDataDTO } from '../../application/dtos/LevelDataDTOs'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/** Metadatos de catálogo (GET /levels): sin la topología pesada del nivel. */
export type LevelMetadata = Omit<LevelDataDTO, 'cells' | 'connections' | 'arrows'>

export class ForgeApiClient {
  /**
   * Login: obtiene JWT token del backend.
   * @throws Error si email/password inválidos o error de red
   */
  static async login(email: string, password: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(
        error.message || `Login falló (${res.status}): ${res.statusText}`,
      )
    }

    const data = await res.json()
    return data.token
  }

  /**
   * Lista el catálogo de niveles existentes (metadatos, público).
   * Se usa en el FORGE para elegir un mapa ya creado y editarlo.
   */
  static async listLevels(): Promise<LevelMetadata[]> {
    const res = await fetch(`${API_BASE}/api/v1/levels`, { method: 'GET' })

    if (!res.ok) {
      throw new Error(
        `No se pudo listar el catálogo de niveles (${res.status}): ${res.statusText}`,
      )
    }

    return res.json()
  }

  /**
   * Obtiene un nivel por ID (público, sin autenticación).
   */
  static async getLevel(id: string): Promise<LevelDataDTO> {
    const res = await fetch(`${API_BASE}/api/v1/levels/${encodeURIComponent(id)}`, {
      method: 'GET',
    })

    if (!res.ok) {
      throw new Error(
        `No se pudo cargar el nivel "${id}" (${res.status}): ${res.statusText}`,
      )
    }

    return res.json()
  }

  /**
   * Crea un nivel (requiere token ADMIN).
   * @throws Error si 409 (conflicto: nivel ya existe) u otro error
   */
  static async createLevel(dto: LevelDataDTO, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/levels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    })

    if (res.status === 409) {
      // Conflicto: nivel ya existe
      throw new Error(`CONFLICT: El nivel "${dto.id}" ya existe en el servidor`)
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(
        error.message || `Error al crear nivel (${res.status}): ${res.statusText}`,
      )
    }
  }

  /**
   * Actualiza un nivel existente (requiere token ADMIN).
   * @throws Error si 404 (no existe) u otro error
   */
  static async updateLevel(id: string, dto: LevelDataDTO, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/levels/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    })

    if (res.status === 404) {
      throw new Error(`Nivel "${id}" no encontrado en el servidor`)
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(
        error.message || `Error al actualizar nivel (${res.status}): ${res.statusText}`,
      )
    }
  }
}
