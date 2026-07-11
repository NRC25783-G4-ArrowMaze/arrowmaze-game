### 2026-07-09 — Fix: ruta del adapter de progreso a /api/v1/progress

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** bugfix
- **Feature:** fix/ruta-progress-v1
- **Linked session:** bug cazado en QA manual de la feature E · misma clase de fallo que el #33 (contrato HTTP)

- **Prompt(s) representativo(s):**
  - "FetchProgressApiClient llama a /api/progress pero el backend monta /api/v1/progress — el sync D2 siempre dio 404. Corrige TODAS las llamadas y añade red de seguridad."

- **Salida tomada de la IA:**
  - `src/infrastructure/api/FetchProgressApiClient.ts` \[MOD\] — `pushProgress` (POST) y `fetchUserProgress` (GET) ahora apuntan a `${this._baseUrl}/api/v1/progress` (antes `/api/progress` → 404). Verificado contra el backend: `ProgressRoutes` monta `POST /` y `GET /` bajo `/api/v1/progress`.
  - `__tests__/infrastructure/FetchProgressApiClient.spec.ts` \[NEW\] — red de seguridad: URL exacta (con `/v1`), método y header `Authorization: Bearer` para upload y download, con `fetch` mockeado; más `401 → SessionExpiredError`.

- **Modificaciones manuales del equipo:**
  - Alcance estricto: solo el adapter + su spec + este registro. Sin cambios de dominio/aplicación/presentación.

- **Validación realizada:**
  - `npm test` → **48 suites / 400 tests** (dev-base 47/396 → +1 suite, +4 tests; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**.

#### 📋 Resumen de la sesión
Fix de una línea de contrato repetida en dos métodos: el sync bidireccional (D2) apuntaba a `/api/progress` mientras el backend expone `/api/v1/progress`, produciendo 404 silenciosos. Se corrige la ruta en ambos métodos y se añade un spec de adapter que fija la URL exacta con `/v1` para que la regresión no vuelva (lección #33).

**Notas / follow-ups:**
- Rama `fix/ruta-progress-v1` nace de `dev`; PR hacia `dev` (no abierto aún).
- Id `2026-07-09-003`: `-002` quedó reservado por la rama de la feature E (aún sin mergear) para evitar colisión al integrar.
