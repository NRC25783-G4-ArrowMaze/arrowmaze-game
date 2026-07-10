### 2026-07-10 — Toast de sesión: bienvenida al login y cierre automático del overlay

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David
- **Fase:** feature (auth UX / presentación)
- **Feature:** feat/login-bienvenida
- **Linked session:** [[2026-07-10-badge-usuario]] (usa `aliasFromEmail` y el contrato `onAuthChanged(true, email)`); tercera misión de la cadena badge → leaderboards → bienvenida

- **Prompt(s) representativo(s):**
  - "Login exitoso cierra el overlay solo + toast '¡Bienvenido, {alias}!' + quedo en el mapa."
  - "SÍ simetría en logout: el overlay también se cierra solo + toast 'Sesión cerrada'. Toast bottom-center, auto-dismiss ~2.5s (dial), click lo cierra antes, aria-live polite, animación sutil, UN toast a la vez."

- **Salida tomada de la IA:**
  - `src/presentation/components/Toast.tsx` \[NEW\] — aviso efímero bottom-center: `role="status"` + `aria-live="polite"`, auto-dismiss por dial (`TOAST_DURATION_MS = 2500`), click cierra antes, entrada/salida con transición CSS (`TOAST_EXIT_MS = 200`), timers centralizados con cleanup (jamás un `onDone` tardío).
  - `src/App.tsx` \[MOD\] — `handleAuthChanged` cierra el `AccountOverlay` en AMBOS sentidos y dispara el toast (login → bienvenida con alias; logout → sesión cerrada); un toast a la vez (remount por nonce). `AccountOverlay` quedó **intacto** (el contrato `onAuthChanged(true, email)` de la Misión 1 bastó).
  - `src/presentation/i18n/catalogs/{es,en}.ts` \[MOD\] — `account.welcome` ('¡Bienvenido, {alias}!' / 'Welcome, {alias}!') y `account.loggedOut` ('Sesión cerrada' / 'Signed out'), paridad verificada.
  - `__tests__/presentation/toast.spec.tsx` \[NEW\] — 5 specs con fake timers: mensaje+a11y, auto-dismiss único, click temprano sin duplicar, cleanup al desmontar, dial custom.

- **Modificaciones manuales del equipo:**
  - Decisiones selladas en la parada: simetría del logout · bottom-center · diales en default tras QA visual · un toast a la vez sin colas.
  - Cherry-pick de `f823061` (a11y de Jesús) evaluado y descartado con evidencia: `git cherry-pick` reportó cero cambios (el contenido ya vive en `dev` vía el squash del #43) — se declara en la descripción del PR, sin commit vacío.

- **Validación realizada:**
  - `npm test` → **536 tests / 65 suites** (base 531/64 → +5; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**; `eslint` → 0 en los archivos tocados.
  - QA visual aprobado: cierre automático en login y logout, toast con alias, click-para-cerrar, reemplazo sin colas.

#### 📋 Resumen de la sesión
Cierre del ciclo de sesión con feedback: al iniciar sesión el overlay se cierra solo y un toast accesible saluda por alias (el dato ya viajaba por el contrato de la Misión 1, así que `AccountOverlay` no se tocó); al cerrar sesión, simetría con "Sesión cerrada". El toast es un componente genérico con diales expuestos — y será el primer candidato a estrenar los tokens del modo oscuro (Misión 4).

**Notas / follow-ups:**
- Rama `feat/login-bienvenida` nace del tip post-rebase de leaderboards (`e253871`); tras el merge del #46 (squash `061577a`) se rebasa `--onto dev` y su PR sale de inmediato.
- Id `2026-07-10-004`.
