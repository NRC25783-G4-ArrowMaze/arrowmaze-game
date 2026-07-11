import React, { useState } from 'react'
import type { Scene } from '../../game/scene'
import { toLevelDataDTO, sceneFromLevelData } from '../../game/scene'
import { ForgeApiClient, type LevelMetadata } from '../../../infrastructure/api/ForgeApiClient'
import { isAdminToken } from '../state/tokenRole'

interface PublishPanelProps {
  scene: Scene
  token: string | null
  email: string | null
  onLogin: (token: string, email: string) => void
  onLogout: () => void
  onLoadScene: (scene: Scene) => void
}

export const PublishPanel: React.FC<PublishPanelProps> = ({
  scene,
  token,
  email,
  onLogin,
  onLogout,
  onLoadScene,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Catálogo de mapas ya creados (admin): lista de metadatos + id en edición.
  const [catalog, setCatalog] = useState<LevelMetadata[] | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // El rol viaja en el JWT; gatea la UI de administración. La autorización real
  // la impone el backend (RBAC ADMIN) en POST/PUT: esto solo pinta la opción.
  const isAdmin = isAdminToken(token)

  // ===== Login =====
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Email y contraseña requeridos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newToken = await ForgeApiClient.login(loginEmail, loginPassword)
      onLogin(newToken, loginEmail)
      setLoginEmail('')
      setLoginPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // ===== Publicar =====
  const handlePublish = async () => {
    if (!token) {
      setError('Debes estar autenticado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const dto = toLevelDataDTO(scene)
      await ForgeApiClient.createLevel(dto, token)
      setError(null)
      alert(`✓ Nivel "${scene.id}" publicado correctamente`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('CONFLICT')) {
        // Nivel ya existe: ofrecer sobrescribir
        if (
          window.confirm(
            `El nivel "${scene.id}" ya existe. ¿Sobrescribir?`,
          )
        ) {
          try {
            const dto = toLevelDataDTO(scene)
            await ForgeApiClient.updateLevel(scene.id, dto, token)
            alert(`✓ Nivel "${scene.id}" actualizado correctamente`)
          } catch (updateErr) {
            setError(
              updateErr instanceof Error ? updateErr.message : String(updateErr),
            )
          }
        }
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ===== Editar mapa existente (ADMIN) =====

  /** Abre/cierra el catálogo; al abrirlo lo trae del backend. */
  const toggleCatalog = async () => {
    if (catalog !== null) {
      setCatalog(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const levels = await ForgeApiClient.listLevels()
      setCatalog(levels)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /** Carga un mapa del catálogo en el editor y lo marca como "en edición". */
  const handleEditExisting = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const dto = await ForgeApiClient.getLevel(id)
      onLoadScene(sceneFromLevelData(dto))
      setEditingId(dto.id)
      setCatalog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /** Guarda los cambios del mapa en edición (PUT, sobrescribe). */
  const handleUpdate = async () => {
    if (!token || !editingId) return
    setLoading(true)
    setError(null)
    try {
      const dto = toLevelDataDTO(scene)
      await ForgeApiClient.updateLevel(editingId, dto, token)
      alert(`✓ Cambios guardados en "${editingId}"`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // ===== Export JSON =====
  const handleExportJSON = () => {
    const dto = toLevelDataDTO(scene)
    const json = JSON.stringify(dto, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scene.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===== Copy para Seed =====
  const handleCopyForSeed = async () => {
    const dto = toLevelDataDTO(scene)
    const json = JSON.stringify(dto, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      alert('✓ JSON copiado al portapapeles (listo para pegar en seeds/levels.seed.json)')
    } catch {
      setError('No se pudo copiar al portapapeles')
    }
  }

  return (
    <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Publicación & Export</h4>

      {/* Export LOCAL: no requiere login (solo Publicar/Cargar usan el backend). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={handleExportJSON}
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          💾 Exportar JSON
        </button>
        <button
          onClick={handleCopyForSeed}
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          📋 Copiar para seed
        </button>
      </div>

      {/* Sin autenticación: form de login (solo para Publicar/Cargar del backend) */}
      {!token ? (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin()
              }}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#0369a1',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </div>
      ) : (
        /* Con autenticación: opciones de publicación */
        <div>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
            Autenticado como: <strong>{email}</strong>
            <button
              onClick={onLogout}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Salir
            </button>
          </div>

          {/* Gestión de niveles del backend: SOLO ADMIN. El resto de sesiones
              ven un aviso (el backend igual rechazaría con 403). */}
          {!isAdmin ? (
            <div
              style={{
                padding: '10px',
                fontSize: '12px',
                color: '#92400e',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '3px',
              }}
            >
              🔒 Publicar y editar mapas requiere una cuenta de administrador.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Banner del mapa en edición + guardar cambios (PUT) */}
              {editingId && (
                <div
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#1e3a8a',
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: '3px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>
                    Editando: <strong>{editingId}</strong>
                  </span>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      backgroundColor: 'transparent',
                      color: '#1e3a8a',
                      border: '1px solid #93c5fd',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Nuevo
                  </button>
                </div>
              )}

              {editingId && (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  style={{
                    padding: '10px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
                </button>
              )}

              <button
                onClick={handlePublish}
                disabled={loading}
                style={{
                  padding: '10px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳ Publicando...' : '📤 Publicar como nuevo'}
              </button>

              {/* Editar mapa ya creado: abre el catálogo del backend */}
              <button
                onClick={toggleCatalog}
                disabled={loading}
                style={{
                  padding: '10px',
                  backgroundColor: '#0369a1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {catalog !== null ? '✕ Cerrar catálogo' : '📂 Editar mapa existente...'}
              </button>

              {/* Lista de mapas existentes (clic para cargar y editar) */}
              {catalog !== null && (
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                  }}
                >
                  {catalog.length === 0 ? (
                    <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      No hay niveles en el servidor.
                    </div>
                  ) : (
                    catalog.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => handleEditExisting(lvl.id)}
                        disabled={loading}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          fontSize: '12px',
                          backgroundColor: editingId === lvl.id ? '#eff6ff' : 'transparent',
                          color: '#111',
                          border: 'none',
                          borderBottom: '1px solid #e5e7eb',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <strong>{lvl.name || lvl.id}</strong>
                        <span style={{ color: '#666' }}>
                          {' '}
                          — {lvl.id} · {lvl.allowedMoves} mov
                          {lvl.difficulty ? ` · ${lvl.difficulty}` : ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '3px',
            fontSize: '12px',
            color: '#991b1b',
          }}
        >
          <strong>❌ Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
