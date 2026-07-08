### 2026-07-08 — Fix del bug de ruta del login en PR #30 (`/api/v1/auth/login`)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David (revisor del PR #30)
- **Fase:** review / bugfix
- **Feature:** login-service (F1 — API Users & Auth)
- **Linked session:** `2026-07-08-pr30-login-service-followup.md` (@Jrgil20 / Santiago — trabajo paralelo)

- **Prompt(s) representativo(s):**
  - "Santiago pusheó en paralelo; guarda lo nuestro, ponte sobre su versión y arregla los errores."
  - "Corregir el 404: la ruta de login sigue en `/api/auth/login` y su test asegura esa URL con el bug."

- **Salida tomada de la IA:**
  - `src/infrastructure/api/FetchAuthApiClient.ts` \[MODIFY\] — línea 19: `/api/auth/login` → `/api/v1/auth/login`. El backend monta auth en `/api/v1/auth` (`arrowmaze-backend/src/index.ts`); la ruta previa devolvía **404** en el primer login real. Alinea con `FetchLevelApiClient` y `ForgeApiClient`.
  - `__tests__/infrastructure/FetchAuthApiClient.spec.ts` \[MODIFY\] — línea 29: la aserción `toHaveBeenCalledWith` pasa de `/api/auth/login` a `/api/v1/auth/login`. El test de Santiago codificaba la ruta con el bug; ahora **protege** de la regresión.

- **Modificaciones manuales del equipo:**
  - Resguardo del trabajo local previo en rama `backup/pr30-fix-local` y reset de la rama a la versión pusheada por Santiago (`origin/feature/login-service`) antes de re-aplicar el fix, para evitar divergencia y conflictos.
  - Se respetó el resto de su trabajo (guard de `NetworkError`, 4 casos de test); solo se corrigieron las dos líneas del bug de ruta.

- **Validación realizada:**
  - `npx jest` (login) → **7/7** ✅ · suite completa → **35 suites / 324 tests** ✅ · `npx tsc --noEmit` → **0 errores** ✅.
  - Revisión del diff: solo los 2 archivos esperados (excluido el ruido de punteros Git LFS en `android/**/*.png`).

#### 📋 Resumen de la sesión
Coordinación de trabajo paralelo sobre el PR #30: el follow-up de Santiago cerró 3 hallazgos menores pero **omitió el bug de ruta** (404) y su test nuevo fijaba la URL incorrecta. Como revisor se re-basó el fix sobre su versión y se corrigió la ruta `/api/v1/auth/login` junto con la aserción del test, dejando la suite en verde.
