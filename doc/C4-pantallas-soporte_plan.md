# C4 — Pantallas de soporte del juego (Pausa y Ajustes)

Feature: **support-screens** (spec: [`C4-pantallas-soporte.feature`](../../arrowmaze-project-core/features/C4-pantallas-soporte.feature))

## Resumen

C4 cubre las pantallas de soporte del ciclo de vida de una partida: Inicio, Victoria/Derrota, Pausa y Ajustes. Victoria/Derrota ya estaban resueltas por `GameOverlay`, e Inicio ya estaba resuelta por `LevelSelectScreen` (C3). C1 ya había implementado el autómata de pila `GameFlowController` (`GameFlowState = 'ACTIVE' | 'PAUSED' | 'SETTINGS'`) y lo había conectado a `useGameController`/`GameView` (el tablero ya dejaba de aceptar input cuando `flowState !== 'ACTIVE'`), pero no existía ningún control de UI que disparara `pause()`, `resume()`, `restart()`, `openSettings()` o `closeSettings()`.

Este plan agregó exclusivamente **Presentation**: dos overlays nuevos (`PauseOverlay`, `SettingsOverlay`), un botón de pausa en `GameView`, y el montaje condicional según `flowState`. No se tocó Dominio, Aplicación, `i18n.ts` (G2) ni nada de audio (G1) o timer (G3) — ambos fuera de alcance por no estar implementados todavía.

**Decisiones de alcance:**
1. **Ajustes = solo contenedor + placeholders.** Secciones "Idioma" y "Audio" con texto "Próximamente"; sin selector real, sin tocar `i18n.ts`, sin nada de audio.
2. **Inicio = reusa `LevelSelectScreen`** (C3) tal cual ya existía. No se creó pantalla Home nueva.
3. El `.feature` se reescribió completo (escenarios reales) antes del código.

---

## Decisiones de Diseño

| # | Decisión | Resolución |
|:---|:---|:---|
| 1 | Alcance de Ajustes dado que G1 (audio) y G3 (timer) no están implementados y G2 (idioma) solo tiene un diccionario ES fijo | Contenedor navegable con placeholders "Próximamente" en Idioma y Audio; sin lógica real |
| 2 | Pantalla de "Inicio" | Se reusa `LevelSelectScreen` (C3), ya montada en `App.tsx` como entrada al juego; no se construye una pantalla Home nueva |
| 3 | `restart()` exige tope `PAUSED` (invariante de C1) | El botón "Reiniciar" solo vive dentro de `PauseOverlay`, nunca como atajo directo desde `IN_PROGRESS` |
| 4 | "Salir" no transiciona `GameFlowController` (sin método `exit()`, decisión ya tomada en C1) | El botón "Salir" de `PauseOverlay` invoca directamente `onBack` (prop ya existente de `GameView`); no llama `resume()` ni ningún método del controller |

---

## Propuesta de Cambios

### Capa de Dominio — Errores

_No aplica._ Sin cambios de Dominio.

### Capa de Dominio — Entidades

_No aplica._ Sin cambios de Dominio.

### Capa de Dominio — Value Objects

_No aplica._ Sin cambios de Dominio.

### Capa de Aplicación — DTOs

_No aplica._ `GameFlowDTOs.ts`, `GameFlowErrors.ts` y `GameFlowController.ts` (C1) se consumen tal cual, sin modificaciones.

### Capa de Aplicación — Use Cases

_No aplica._

### Capa de Presentación — Componentes

#### [NEW] `src/presentation/components/PauseOverlay.tsx`

Componente puro, mismo patrón visual que `GameOverlay.tsx` (`position:absolute;inset:0`, estilos inline). Props: `visible`, `onResume`, `onRestart`, `onOpenSettings`, `onExit`. Retorna `null` si `!visible`.

#### [NEW] `src/presentation/components/SettingsOverlay.tsx`

Mismo patrón. Props: `visible`, `onClose`. Dos secciones estáticas ("Idioma", "Audio") con texto "Próximamente" y botón "Volver" → `onClose`.

#### [MODIFY] `src/presentation/components/GameView.tsx`

- Botón de Pausa en `app-header`, visible solo si `game.status === 'IN_PROGRESS'`, `disabled={game.inFlight}`, llama a `game.pause`.
- `PauseOverlay` y `SettingsOverlay` montados dentro del contenedor `position:relative` existente, después de `GameOverlay` en el árbol, controlados por `game.flowState`.

### Tests

- `__tests__/presentation/pauseOverlay.spec.tsx` — visibilidad por `visible` prop; callbacks expuestos sin envolver.
- `__tests__/presentation/settingsOverlay.spec.tsx` — mismo patrón para `onClose`; contenido de placeholders.
- `__tests__/presentation/gameFlowNavigation.spec.ts` — mapea los `Rule` del `.feature` sobre `GameController` + `GameFlowController` directamente (pausa bloquea input, resume preserva estado, restart exige `PAUSED`, `openSettings`/`closeSettings` respetan la pila, cobertura de navegación reversible).

---

## Archivos que NO se tocan

- `src/domain/entities/GameSession.ts`
- `src/domain/errors/GameErrors.ts`
- `src/application/dtos/GameFlowDTOs.ts`
- `src/application/errors/GameFlowErrors.ts`
- `src/application/services/GameFlowController.ts`
- `src/presentation/game/useGameController.ts` (solo se consume)
- `src/presentation/components/GameOverlay.tsx`
- `src/presentation/game/LevelSelectScreen.tsx`
- `src/presentation/i18n/i18n.ts`
- `src/App.tsx`
- Cualquier archivo de audio/timer (G1/G3, no implementados)
- `__tests__/application/GameFlowController.spec.ts` (C1)

---

## Orden de Implementación

| Paso | Archivo | Justificación |
|:---|:---|:---|
| 1 | `features/C4-pantallas-soporte.feature` reescrito | Corrige el concepto obsoleto ("PAUSED aún no existe") y fija el contrato de comportamiento antes del código |
| 2 | `PauseOverlay.tsx` | Componente aislado, replica `GameOverlay.tsx` |
| 3 | `SettingsOverlay.tsx` | Igual que el paso 2 |
| 4 | Tests de ambos overlays | Cobertura aislada antes de integrar |
| 5 | `GameView.tsx`: botón Pausa + montaje condicional | Integración final |
| 6 | `gameFlowNavigation.spec.ts` | Cobertura de las `Rule` de navegación end-to-end |
| 7 | `pnpm test` | Regresión: 32 suites / 310 tests, todos verdes (incluye C1 intacto) |
| 8 | `pnpm lint` | Sin errores nuevos (8 preexistentes no relacionados, confirmados vía `git stash`) |
| 9 | `pnpm gen-uml` | Sin cambios en `classes.puml`: el script solo escanea `.ts`, no `.tsx` (mismo comportamiento ya existente para `GameOverlay.tsx`) |

---

## Riesgos Identificados

| Riesgo | Mitigación |
|:---|:---|
| Tap de Pausa justo cuando `inFlight` pasa a `true` | `pause()` ya es no-op si `inFlight`; `disabled` en el botón es solo feedback visual |
| Confundir "Salir" con una transición del controller | `onExit` invoca únicamente `onBack`, sin `resume()`/`closeSettings()` |
| `restart()` invocado fuera de `PauseOverlay` en el futuro | Único punto de entrada a `restart` es el botón dentro de `PauseOverlay` (solo visible en `PAUSED`) |
| `SettingsOverlay` genera expectativa de que Idioma/Audio son configurables | Texto "Próximamente" explícito, documentado como transitorio hasta G1/G2 |
| Divergencia `status`/`flowState` (defensa en profundidad) | Los overlays de C4 solo dependen de `flowState`, nunca de `status` |

---

## Criterios de Completitud

```
[x] features/C4-pantallas-soporte.feature reescrito, sin marcadores [TODO], PAUSED/SETTINGS documentados como ya existentes (C1)
[x] PauseOverlay creado: visible solo con flowState === 'PAUSED', expone Reanudar/Reiniciar/Ajustes/Salir
[x] SettingsOverlay creado: visible solo con flowState === 'SETTINGS', secciones Idioma/Audio con "Próximamente", botón Volver → closeSettings()
[x] GameView.tsx: botón de Pausa visible solo con status IN_PROGRESS, disabled mientras inFlight
[x] GameView.tsx: PauseOverlay y SettingsOverlay montados dentro del contenedor position:relative existente, después de GameOverlay
[x] onExit de PauseOverlay invoca onBack directamente, sin pasar por ningún método de GameFlowController
[x] Todos los Rule del .feature C4 cubiertos por tests (pauseOverlay.spec.tsx, settingsOverlay.spec.tsx, gameFlowNavigation.spec.ts)
[x] pnpm test pasa sin errores (32 suites, 310 tests; incluye C1 GameFlowController.spec.ts sin modificación)
[x] pnpm lint sin errores nuevos (8 preexistentes confirmados no relacionados)
[x] pnpm gen-uml ejecutado (sin cambios: script no incluye .tsx)
[x] Dominio (GameSession, GameStatus) y Aplicación (GameFlowController, GameFlowDTOs, GameFlowErrors) sin cambios
[x] i18n.ts sin cambios; sin código de audio/timer (G1/G3) introducido
```
