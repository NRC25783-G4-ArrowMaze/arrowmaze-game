### 2026-07-10 — Modo oscuro: tokens CSS, ThemeProvider en caliente y toggle en el header (G4)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David
- **Fase:** feature (presentación + puerto de aplicación + adapter de infraestructura)
- **Feature:** feat/modo-oscuro
- **Linked session:** 2026-07-10-higiene-sync (la rama nace del tip rebasado de higiene sobre dev post-#51); Paso adelantado en la cola sync→D1.5→modo-oscuro por decisión del usuario

- **Prompt(s) representativo(s):**
  - "Inventario de colores: TODO lo hardcodeado (inline styles de overlays — la deuda del review del #38 —, App.css nuevo del #49, gradiente de .app, contenedor del tablero, y el theme.ts del SVG)."
  - "Puerto IThemePreference + adapter Capacitor (calca de ILanguagePreferenceProvider) + ThemeProvider/useTheme aplicando data-theme en el root. Cambio EN CALIENTE."
  - "ADICIÓN — TOGGLE EN EL HEADER: muestra 🌙 cuando el tema activo es OSCURO y ☀️ cuando es CLARO; aria-label i18n dinámico; misma fuente de verdad que el selector de Ajustes."

- **Salida tomada de la IA:**
  - `src/application/ports/IThemePreference.ts` \[NEW\] — puerto gemelo de `ILanguagePreferenceProvider` (getTheme/setTheme).
  - `src/infrastructure/theme/CapacitorThemePreference.ts` \[NEW\] — adapter sobre `@capacitor/preferences`, key `ui_theme_preference`.
  - `src/presentation/theming/` \[NEW\] — `themeMode.ts` (`resolveInitialTheme`: guardada > prefers-color-scheme > claro), `ThemeContext.ts` (`useTheme`), `ThemeProvider.tsx` (dos fases como I18nProvider; estampa `data-theme` en `<html>` → cambio en caliente sin re-render).
  - `src/presentation/components/ThemeToggleButton.tsx` \[NEW\] — toggle del header (☀️/🌙, `aria-pressed`, aria-label i18n dinámico). Glifos: emoji directo, el patrón que el #49 estableció para ⚙️/👤.
  - `src/index.css` \[MOD\] — 19 tokens nuevos + bloque `[data-theme="dark"]` con `color-scheme: dark` (controles nativos gratis); residuos migrados.
  - `src/App.css` \[MOD\] — gradiente `.app`, header, stats, board-frame, backdrop y sombras a `var()`.
  - `src/presentation/theme.ts` \[MOD\] — `BOARD_BACKGROUND`/`DOT_COLOR` pasan a `var(--board-bg)`/`var(--board-dot)` (SVG inline resuelve var() en fill/stroke).
  - Overlays (Account/Game/Pause/Settings/Leaderboard), `Toast`, `LevelNodeCard`, `LevelSelectScreen`, `GameController` (fallback `#000000`→`var(--text)`) \[MOD\] — 60+ colores inline a tokens (salda la deuda del review del #38).
  - `SettingsOverlay` \[MOD\] — sección Tema entre Idioma y Audio (2 botones `aria-pressed`); `App.tsx` \[MOD\] — `ThemeToggleButton` junto al botón de Cuenta; `main.tsx` \[MOD\] — wiring del provider.
  - Catálogos es/en \[MOD\] — `settings.theme.*` y `theme.toggle.*` (paridad vigente).
  - `features/G4-modo-oscuro.feature` \[NEW\] + 4 specs nuevos: `themeResolution` (pura), `themeProvider` (persiste/aplica/sistema), `themeHotSwap` (sin remount + espejo header↔Ajustes), `CapacitorThemePreference` (contrato de storage).

- **Modificaciones manuales del equipo:**
  - Decisiones selladas por el usuario: conservar la nomenclatura de tokens existente (`--text`/`--text-muted`/`--primary` — capa original de Jesús en /preview, continuidad de equipo); Forge y /preview fuera del v1 (la página /preview de Jesús no se toca, se cita como referencia); consolidaciones aprobadas (incl. verde Material `#4CAF50` del focal → `--success`, cambio sutil de tono en claro pendiente de su QA visual).
  - **Decisión consciente — 2 opciones sin "sistema":** elegir manualmente un tema una vez desactiva el seguimiento de `prefers-color-scheme` para siempre (no hay "volver a auto"). Coherente con el precedente del selector de idioma; "+sistema" solo pagaría con usuarios que alternan el SO a diario.
  - Regla B1 respetada: los colores de las flechas son dato del nivel y NO migran; contraste verificado sobre `--board-bg` oscuro (`#16213a`) — peor caso blue `#3b82f6` ≈ 3:1 (AA para glifos gráficos grandes).

- **Validación realizada:**
  - `npm test` → **559 tests / 70 suites** (base 544/66 → +15; 0 regresiones; la paridad i18n cubre las claves nuevas sin cambios).
  - `npx tsc --noEmit` → **0 errores**; `eslint .` → limpio.
  - El spec del provider cazó (y se corrigió) una carrera real: la carga async de la preferencia guardada pisaba una elección hecha por el usuario antes de resolver (`userChose` ref: la elección explícita siempre gana).

#### 📋 Resumen de la sesión
La capa de tokens claros de `index.css` ("Dark mode = feature futura", de Jesús) se extiende a un sistema de dos temas: 19 tokens nuevos + bloque `[data-theme="dark"]`, y TODO color hardcodeado del alcance (overlays del #38, App.css del #49, mapa, Toast, tablero SVG) migra a `var()`. `ThemeProvider` calca el patrón de i18n (puerto en aplicación, adapter Capacitor, resolución guardada > sistema > claro) y estampa `data-theme` en el root: el cambio es en caliente, sin re-render, con el SVG incluido vía var() en fill/stroke. Dos puntos de control con una sola fuente de verdad: selector en Ajustes y toggle ☀️/🌙 en el header del mapa.

**Notas / follow-ups:**
- **Para el QA visual del usuario:** el focal del mapa ("Siguiente →") cambia sutilmente de verde en claro (`#4CAF50` → `#16a34a`) por la consolidación aprobada — validar con los ojos.
- Espejar `G4-modo-oscuro.feature` en `arrowmaze-project-core` (fuente única de specs).
- Rama `feat/modo-oscuro` desde `76f5571` (tip de `fix/higiene-sync` rebasado sobre dev post-#51 en esta misma sesión, Paso A).
- Id `2026-07-10-009`.
