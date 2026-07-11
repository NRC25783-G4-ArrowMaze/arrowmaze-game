### 2026-07-10 — Badge de usuario logueado en el header

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** feature (auth / presentación)
- **Feature:** feat/badge-usuario
- **Linked session:** base de la doble misión badge + leaderboards; feat/leaderboards-cliente se apila sobre ésta

- **Prompt(s) representativo(s):**
  - "Al iniciar sesión, el botón Cuenta muestra la identidad del usuario (parte local del email). Sobrevive al F5. Al cerrar sesión vuelve a Cuenta."
  - "Extender IAuthTokenProvider con get/set/removeEmail (la identidad de sesión es cohesiva con el token). aliasFromEmail puro, preservando el caso tecleado."

- **Salida tomada de la IA:**
  - `src/application/ports/IAuthTokenProvider.ts` \[MOD\] — +`getEmail`/`setEmail`/`removeEmail` (identidad de sesión cohesiva con el token).
  - `src/infrastructure/auth/CapacitorTokenProvider.ts` \[MOD\] — implementa los 3 (clave hermana `auth_session_email`; `getEmail` fail-safe → null).
  - `src/application/services/LoginUser.ts` \[MOD\] — persiste el email SOLO tras login exitoso. `LogoutUser.ts` \[MOD\] — `removeToken`+`removeEmail` juntos en el `finally` (fail-open).
  - `src/presentation/account/aliasFromEmail.ts` \[NEW\] — función pura (trim; con @ → parte local tal cual; sin @ → cadena completa; vacío → '').
  - `src/presentation/components/AccountButton.tsx` \[NEW\] — botón del header: alias (contenido) + `aria-label` de sesión activa, o label i18n.
  - `src/presentation/components/AccountOverlay.tsx` \[MOD\] — `onAuthChanged(authenticated, email?)`: pasa el email en login (badge inmediato).
  - `src/App.tsx` \[MOD\] — estado `userEmail` (lee `getEmail` en mount → F5); 401 auto-logout limpia token+email.
  - `src/presentation/i18n/catalogs/{es,en}.ts` \[MOD\] — +`account.ariaLoggedIn` (paridad).

- **Modificaciones manuales del equipo:**
  - Diseño aprobado en tabla con condiciones selladas: email persistido SOLO en login exitoso (jamás tecleando/registrando ni en logs); logout lo borra siempre (incl. fail-open); alias preserva el caso; migración (token sin email) → label genérico sin crash.
  - Alcance: cero dominio; application = puerto + `LoginUser`/`LogoutUser`.

- **Validación realizada:**
  - `npm test` → **504 tests / 60 suites** (base dev 485/57 → **+19 tests, +3 suites**; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**; `eslint` → 0 en los archivos tocados.

#### 📋 Resumen de la sesión
El botón "Cuenta" del header muestra el alias del usuario (parte local del email) al iniciar sesión y sobrevive al F5. La identidad se persiste junto al token (mismo puerto/adapter/ciclo de vida): `LoginUser` guarda el email solo tras un login exitoso y `LogoutUser` lo borra siempre, incluido el camino fail-open. `aliasFromEmail` es una función pura probada en sus bordes; el badge es un componente aislado (`AccountButton`) con aria-label de sesión activa. Migración cubierta: una sesión previa sin email cae al label genérico sin romperse.

**Notas / follow-ups:**
- Rama `feat/badge-usuario` nace de `dev`; PR hacia `dev` se abre de inmediato.
- Id `2026-07-10-001`.
- `feat/leaderboards-cliente` se apila sobre ésta (comparten `App.tsx` y catálogos).
