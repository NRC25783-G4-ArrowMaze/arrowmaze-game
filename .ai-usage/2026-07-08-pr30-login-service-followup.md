### 2026-07-08 — Follow-up fixes del PR #30 (login-service)

- **Herramienta:** Antigravity (Gemini)
- **Modelo / versión:** Claude Opus 4.6 (Thinking)
- **Autor humano responsable:** @Jrgil20
- **Prompt(s) representativo(s):**
  - "soluciona los siguientes 3 problemas y cada uno en un commit correspondiente"
- **Salida tomada de la IA:**
  - `src/infrastructure/api/FetchAuthApiClient.ts` \[MODIFY\] — Agregado guard `if (error instanceof NetworkError) throw error` en el bloque catch de `login()` para evitar re-envoltura redundante del `NetworkError` que se lanza desde la rama `!response.ok`. Replica el patrón correcto de `FetchLevelApiClient.ts`.
  - `__tests__/infrastructure/FetchAuthApiClient.spec.ts` \[NEW\] — Tests de infraestructura para el adaptador HTTP de autenticación, cubriendo: login exitoso (token devuelto), status 401 (`InvalidCredentialsError`), HTTP error no-401 (`NetworkError`), y respuesta 200 sin token en el payload (error de contrato re-envuelto como `NetworkError`).
  - `src/application/errors/AuthErrors.ts` \[MODIFY\] — Añadido salto de línea final (EOF newline).
  - `src/application/ports/IAuthApiClient.ts` \[MODIFY\] — Añadido salto de línea final.
  - `src/application/services/LoginUser.ts` \[MODIFY\] — Añadido salto de línea final.
  - `__tests__/application/LoginUser.spec.ts` \[MODIFY\] — Añadido salto de línea final.
  - `.ai-usage/2026-07-07-login-service.md` \[MODIFY\] — Corregidas dos rutas incorrectas: `src/domain/errors/AuthErrors.ts` → `src/application/errors/AuthErrors.ts`; `tests/application/LoginUser.spec.ts` → `__tests__/application/LoginUser.spec.ts`. Añadido salto de línea final.
- **Modificaciones manuales del equipo:** Ninguna — los 3 fixes se aplicaron tal como se propusieron en la revisión del PR.
- **Validación realizada:** `pnpm test` — 35 suites / 324 tests (4 nuevos) pasando sin regresiones; `pnpm tsc --noEmit` — limpio; `git diff --stat` verificado manualmente para confirmar que solo los archivos esperados fueron modificados.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~5 minutos
- **Contexto de la conversación:** Resolución de 3 hallazgos menores detectados durante la revisión del PR #30 (feature/login-service), ya aprobado. Los hallazgos fueron: (1) re-envoltura redundante de NetworkError en FetchAuthApiClient, (2) falta de test de infraestructura para FetchAuthApiClient, (3) archivos sin newline final y rutas incorrectas en el doc de AI usage.
- **Decisiones clave tomadas:**
  1. El guard de NetworkError replica exactamente el patrón de FetchLevelApiClient (consistencia inter-adaptadores).
  2. El test del caso "200 sin token" verifica que el Error genérico se re-envuelve como NetworkError por el catch, confirmando que el guard funciona correctamente.
- **Patrones de uso observados:** Directivo — el plan completo fue proporcionado por el desarrollador; el agente ejecutó sin desviaciones.
