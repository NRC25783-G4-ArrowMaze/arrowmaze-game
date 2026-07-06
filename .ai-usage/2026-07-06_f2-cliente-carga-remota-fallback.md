### 2026-07-06 — F2 cliente: carga remota de niveles con fallback offline

- **Herramienta:** Claude / Cursor
- **Modelo / versión:** claude-opus-4-8 (Fase 3, implementación cliente), claude-fable-5 (diseño/E2E)
- **Autor humano responsable:** Jrgil20
- **Prompt(s) representativo(s):**
  - "...quiero empezar a implementarlo con un plan... en el repositorio arrowmaze-game, ya hay como dos niveles iniciales"
  - Implícitamente: alcance end-to-end, consumo del backend F2 en el cliente con fallback offline-first
- **Salida tomada de la IA:**
  - **Exportación de niveles (script reutilizado en seed backend):**
    - `scripts/export-levels-seed.ts` — exporta SAMPLE_LEVEL_2 + HEART_SCENE a JSON vía toLevelDataDTO(), añade name/difficulty
  - **Infraestructura F2 cliente:**
    - `src/application/ports/ILevelApiClient.ts` — puerto abstracto fetchLevel(levelId)
    - `src/infrastructure/api/FetchLevelApiClient.ts` — implementación con timeout 3s, AbortController, GET /api/v1/levels/:id (sin token)
  - **Reconstrucción de Scene desde DTO:**
    - `src/presentation/game/scene.ts` — extendida: `DEFAULT_ARROW_PALETTE` (8 colores de SAMPLE_LEVEL_2), `sceneFromLevelData()` (inversa de toLevelDataDTO, parsea col/row desde "col,row", asigna color por índice)
  - **Fallback offline-first:**
    - `src/presentation/game/loadScene.ts` — `fetchSceneWithFallback(client, levelId, fallback)`: un punto de captura para red caída, 404, payload malformado
  - **Refactorización de App:**
    - `src/presentation/components/GameView.tsx` — **nuevo**: partida sobre una Scene ya resuelta (local o remota). Extraído de App porque useGameController congela Scene en primer render
    - `src/App.tsx` — refactorizado: bootstrap paralelo (fetch remoto + módulo progreso) con `Promise.allSettled`, fallback a SAMPLE_LEVEL_2 local, monta GameView cuando scene ≠ null
  - **Tests (3 specs nuevos):**
    - `__tests__/presentation/sceneFromLevelData.spec.ts` — rebuild col/row, color por paleta, roundtrip toLevelDataDTO∘sceneFromLevelData, palette equivalencia con SAMPLE_LEVEL_2, default connections, throw en id malformado
    - `__tests__/infrastructure/FetchLevelApiClient.spec.ts` — URL exacta, 404/500 → NetworkError, timeout/abort
    - `__tests__/presentation/loadScene.spec.ts` — fetch remoto ok, fallback on fail, fallback on malformed payload
- **Modificaciones manuales del equipo:** 
  - Corrección menor en test FetchLevelApiClient: `mockResolvedValue` en vez de `mockResolvedValueOnce` para reutilizabilidad
  - Ninguna otra: código generado compiló a primera y tests pasaron
- **Validación realizada:**
  - TypeScript: 0 errores
  - Jest suite: 261/261 tests pasando (27 suites, incluye 3 nuevos para F2)
  - Verificación offline: tests de loadScene cubren todos los escenarios de fallback
  - Verificación online: validado contra backend en :3210 (GET /api/v1/levels/sample-level-2 devuelve LevelData correcta)
  - Lint: ESLint sin warnings en todos los archivos nuevos

---

#### 📋 Resumen de la sesión cliente

- **Duración estimada:** 8 turnos / ~30 minutos (design → implementación → tests → E2E)
- **Contexto:** Implementación de F2 del lado cliente. Desafío clave: `useGameController` congela la Scene en el primer render → requería extraer GameView y condicionar su montaje. Requisito offline-first (fallback silencioso a SAMPLE_LEVEL_2 local).
- **Decisiones clave:**
  - Extraer `GameView`: permite que App resuelva Scene (vía fetch remoto o fallback) **antes** de montar el controlador del juego
  - Timeout 3s en FetchLevelApiClient: equilibrio entre responsividad y fallo rápido si el backend se cae
  - Paleta por defecto = colores de SAMPLE_LEVEL_2 en orden: nivel remoto renderiza exacto al local (JSON preserva orden)
  - `Promise.allSettled` en App bootstrap: fallo del fetch remoto no bloquea SQLite, fallo de SQLite no bloquea fetch
- **Patrones de uso:** Iterativo + arquitectónico (usuario aprobó diseño de 4 fases antes, IA ejecutó sistemáticamente)
