import React, { useState } from 'react'
import type { Scene } from '../../game/scene'
import { toLevelDataDTO, sceneFromLevelData } from '../../game/scene'
import { ForgeApiClient } from '../../../infrastructure/api/ForgeApiClient'

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

  // ===== Cargar =====
  const handleLoad = async () => {
    const levelId = prompt('ID del nivel a cargar:')
    if (!levelId) return

    setLoading(true)
    setError(null)

    try {
      const dto = await ForgeApiClient.getLevel(levelId)
      const loadedScene = sceneFromLevelData(dto)
      onLoadScene(loadedScene)
      alert(`✓ Nivel "${levelId}" cargado`)
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

          {/* Botones de acción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              {loading ? '⏳ Publicando...' : '📤 Publicar nivel'}
            </button>

            <button
              onClick={handleLoad}
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
              {loading ? '⏳ Cargando...' : '📥 Cargar nivel...'}
            </button>
          </div>
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
