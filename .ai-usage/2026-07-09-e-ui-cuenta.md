### 2026-07-09 — E: UI de Cuenta (login/registro/logout) (SDD)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** implementation (spec-driven)
- **Feature:** E-ui-cuenta
- **Linked session:** `features/E1-register_and_login.feature` + `features/E2-active_session_management.feature` (specs fuente) · contrato HTTP en `features/F1-api_users_auth.feature` · apilado sobre `feature/g1-audio-sfx-musica` (PR #37)

- **Prompt(s) representativo(s):**
  - "UI de Cuenta (cliente grupo E): E1/E2 son ley; extiende lo que ya existe (LoginUser, IAuthApiClient, CapacitorTokenProvider), no reinventes."
  - "Parada obligatoria en la tabla escenario→diseño→test antes de tocar código."
  - "AccountOverlay visualmente INDISTINGUIBLE de los overlays existentes: calca PauseOverlay/SettingsOverlay, clases btn-primary, paleta del repo; la consistencia ES el diseño."

- **Salida tomada de la IA:**
  - `src/application/services/credentialPolicy.ts` \[NEW\] — **puro**: `isValidEmail` (RFC 5322 pragmático) + `validatePassword` (≥8 · 1 dígito · 1 mayúscula), política E1 literal; única fuente para use case y overlay.
  - `src/application/services/RegisterUser.ts` \[NEW\] — valida ANTES de la red (lanza `ValidationError` tipado) y delega; **no** guarda token (backend 201 sin token → sin auto-login).
  - `src/application/services/LogoutUser.ts` \[NEW\] — revoca en servidor y **fail-open local**: `removeToken()` en `finally` aunque la red falle; nunca deja al usuario atrapado en "logueado".
  - `src/application/ports/IAuthApiClient.ts` \[MOD\] — puerto extendido con `register`/`logout` (login intacto).
  - `src/application/errors/AuthErrors.ts` \[MOD\] — `ValidationError` (con `field: 'email'|'password'` + mensajes E1 literales) y `EmailAlreadyInUseError`; reusa `InvalidCredentialsError`.
  - `src/infrastructure/api/FetchAuthApiClient.ts` \[MOD\] — `register` (POST /api/v1/auth/register; 409→EmailAlreadyInUse, 400→ValidationError) y `logout` (POST /api/v1/auth/logout, header `Authorization: Bearer`).
  - `src/presentation/components/AccountOverlay.tsx` \[NEW\] — overlay calcado (position:absolute;inset:0, role="dialog", btn-primary, paleta `#374151`/`#6b7280`, `var(--danger)`/`var(--success)`); estados deslogueado/cargando/error/logueado; validación inline; mapeo de error→i18n por TIPO (nunca el mensaje crudo).
  - `src/presentation/i18n/catalogs/{es,en}.ts` \[MOD\] — bloque `account.*` (18 claves) en ambos catálogos.
  - `src/App.tsx` \[MOD\] — composition root: `useMemo` de LoginUser/RegisterUser/LogoutUser sobre `FetchAuthApiClient`+`CapacitorTokenProvider`; botón "Cuenta" en el header SELECT; estado de sesión inicial (token presente = logueado); re-sync D2 al iniciar sesión.
  - Tests \[NEW\]: `credentialPolicy`, `RegisterUser`, `LogoutUser`, `accountOverlay` (render + use-cases sobre puertos mockeados). `FetchAuthApiClient.spec` ampliado (URLs + method + header Bearer + status 400/401/409).

- **Modificaciones manuales del equipo:**
  - Decisión aprobada en la tabla: validadores puros en `application/services/credentialPolicy` (enmienda a la regla dura: application admite 2 servicios + credentialPolicy + errores nuevos + puerto extendido). `LoginUser` **no** se tocó.
  - Contrato F1 gana sobre la propuesta de auto-login: registro devuelve 201 sin token ⇒ post-registro vuelve a login con mensaje de éxito.
  - Anti-enumeración E1: credenciales inválidas y usuario inexistente comparten un único mensaje (`invalidCredentials`).
  - Botón "Cuenta" en el header de App (no en `LevelSelectScreen`, que quedó intacto).

- **Validación realizada:**
  - `npm test` → **51 suites / 438 tests** (base G1 47/396 → +4 suites, +42 tests; 0 regresiones). El test de paridad exigió las 18 claves `account.*` en ambos catálogos.
  - `npx tsc --noEmit` → **0 errores**. ESLint verde en los archivos nuevos/modificados; fronteras de capa respetadas (presentation→application; application sin infraestructura). El password nunca se persiste ni se loguea.

#### 📋 Resumen de la sesión
UI de cuenta como capa fina sobre la infraestructura de auth existente: puerto extendido con register/logout, dos servicios nuevos (RegisterUser con validación-antes-de-la-red, LogoutUser fail-open local), validadores puros de la política E1, adapter HTTP con spec que asserta URL/method/Bearer/status, y AccountOverlay indistinguible de los overlays del juego con mapeo de errores a i18n por tipo. Sin datos personales nuevos persistidos: la sesión es el token.

**Notas / follow-ups:**
- Rama **apilada** sobre G1 (PR #37); el PR de E se abre tras mergear #37 con rebase `--onto origin/dev feature/g1-audio-sfx-musica feature/e-ui-cuenta`.
- Deuda de lint **preexistente** (LocalProgressModuleFactory, ForgeApp, ValidationPanel, LevelSelectScreen) fuera de alcance — no introducida por E.
- Pendiente acumulado el `docs:` de `gen-uml` + árbol de arquitectura (nuevos servicios auth + puerto extendido).
