### 2026-07-08 — G2: Internacionalización ES/EN (SDD)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** implementation (spec-driven)
- **Feature:** G2-internacionalizacion
- **Linked session:** `features/G2-internacionalizacion.feature` (spec fuente, sincronizado desde arrowmaze-project-core)

- **Prompt(s) representativo(s):**
  - "Implementa G2 (i18n ES/EN) spec-driven; el .feature manda (D1–D4, P24)."
  - "Inventario de strings hardcodeados → tabla componente/clave, con parada obligatoria antes de tocar código."
  - "Motor con test de paridad de claves primero; puerto de preferencia como IAuthTokenProvider; cambio en caliente con provider+hook."

- **Salida tomada de la IA:**
  - `src/presentation/i18n/i18n.ts` \[MODIFY\] — motor: `translate` (fallback a EN, D4), `resolveInitialLanguage` (D1/D2), interpolación `{param}`, `CATALOGS`.
  - `src/presentation/i18n/catalogs/es.ts`, `en.ts` \[NEW\] — catálogos externalizados con claves idénticas.
  - `src/presentation/i18n/I18nContext.ts`, `I18nProvider.tsx` \[NEW\] — contexto + hook `useTranslation` + provider (cambio en caliente D3, persistencia D2). Separados para respetar `react-refresh/only-export-components`.
  - `src/application/ports/ILanguagePreferenceProvider.ts` \[NEW\] — puerto de persistencia (patrón `IAuthTokenProvider`).
  - `src/infrastructure/i18n/CapacitorLanguagePreference.ts` \[NEW\] — impl con `@capacitor/preferences`.
  - Migración a `t()` de: `GameOverlay`, `GameView`, `PauseOverlay`, `SettingsOverlay` (+ selector de idioma), `LevelSelectScreen`, `LevelNodeCard`, `App.tsx`; provider montado en `main.tsx`.
  - Tests \[NEW\]: `i18nKeyParity`, `i18nLanguageResolution`, `i18nTranslate`, `i18nHotChange`. Tests migrados a `render()`: `gameOverlay`, `pauseOverlay`, `settingsOverlay`, `gameFlowNavigation` (`.ts`→`.tsx`).

- **Modificaciones manuales del equipo:**
  - Decisiones aprobadas por el autor: contador de movimientos mantiene diseño label+número con `game.movesLeft` interpolado en el `aria-label`; rename de claves `c3.*` → `levelSelect.*`; `LEVEL_METADATA.difficulty` pasa a clave semántica (`easy`/`medium`/`hard`/`veryHard`) — verificado por grep que ningún otro consumidor dependía del literal.
  - Trade-off de tests acordado: el patrón "componente como función pura" es incompatible con hooks → `render()` de @testing-library solo en los 4 specs que consumen contexto i18n; la lógica pura sigue como función pura. Documentado en cabecera de cada spec migrado.
  - Alcance respetado: cero cambios en `src/domain` y `src/application/services`; FORGE (`src/presentation/forge/**`) fuera de alcance (follow-up H1); niveles/DTOs intactos.

- **Validación realizada:**
  - `npm test` → **40 suites / 351 tests** (base dev 36/330 → +4 suites, +21 tests; 0 regresiones).
  - `npx tsc --noEmit` → **0 errores**. ESLint sin errores nuevos (queda 1 preexistente en `LevelSelectScreen`, ajeno a G2).

#### 📋 Resumen de la sesión
Implementación spec-driven de G2 con parada obligatoria en la tabla de inventario antes de tocar código. i18n como asunto exclusivo de presentación (invariante central del spec): dominio, DTOs y score no cambian con el idioma. Test de paridad de claves ES/EN como sello de QA, cambio en caliente probado end-to-end (re-render sin perder estado + persistencia de preferencia).
