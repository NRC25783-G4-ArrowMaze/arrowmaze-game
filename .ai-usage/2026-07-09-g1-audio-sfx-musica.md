### 2026-07-09 — G1: Audio (SFX + música) (SDD)

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** implementation (spec-driven)
- **Feature:** G1-audio-sfx-musica
- **Linked session:** `features/G1-audio-sfx-musica.feature` (spec fuente) · apilado sobre `feature/g3-temporizador-nivel` (PR #36)

- **Prompt(s) representativo(s):**
  - "Implementa G1 (audio SFX + música) spec-driven; el .feature manda (P22, D1–D5)."
  - "Assets empaquetados, música por dificultad (pool de 3), SFX por outcome, mute+volúmenes en Ajustes, autoplay tras 1ª interacción, créditos desde LICENCIAS.txt."
  - "El audio es proyección de solo lectura; el juego jamás se rompe por audio; tests con engine mockeado."

- **Salida tomada de la IA:**
  - `public/audio/sfx/*.mp3` (5) + `public/audio/music/{easy,medium,hard}.mp3` (3) \[NEW, LFS\] — assets royalty-free (~3.6 MB, P22 <10MB).
  - `src/application/ports/IAudioPreferences.ts` \[NEW\] — puerto de persistencia (patrón ILanguagePreferenceProvider).
  - `src/infrastructure/audio/CapacitorAudioPreferences.ts` \[NEW\] — impl con @capacitor/preferences.
  - `src/presentation/audio/audioPolicy.ts` \[NEW\] — **puro**: sfxForOutcome (destroyed→exited), prioritizeOutcome (exited>blocked>advanced), trackForDifficulty (veryHard→hard, default easy), effectiveGain (mute/volúmenes), canPlay (gate autoplay).
  - `src/presentation/audio/AudioEngine.ts` \[NEW\] — envuelve HTMLAudioElement; toda operación en try/catch (nunca lanza).
  - `src/presentation/audio/audioCredits.ts` \[NEW\] — créditos desde LICENCIAS.txt (autores/pistas = contenido; XtremeFreddy easy/medium con atribución obligatoria).
  - `src/presentation/audio/{AudioContext.ts,AudioProvider.tsx}` \[NEW\] — carga prefs al arrancar, persiste, desbloquea autoplay (D4).
  - `src/presentation/game/useGameAudio.ts` \[NEW\] — hook driver (proyección de solo lectura).
  - Integración: `useGameController` (+signal `tickOutcome`), `GameView` (monta audio + prop difficulty), `App` (pasa difficulty de LEVEL_METADATA), `main.tsx` (AudioProvider), sección Audio real en `SettingsOverlay` (mute, sliders, créditos) + claves i18n.
  - Tests \[NEW\]: `audioPolicy`, `audioCredits`, `audioEngine` (robustez en jsdom), `useGameAudio` (engine mock, renderHook). `settingsOverlay.spec` ampliado (controles de audio + persistencia).

- **Modificaciones manuales del equipo:**
  - Decisiones aprobadas: nombres cortos `easy/medium/hard.mp3` (mapeo trivial); dificultad desde LEVEL_METADATA (App→GameView, veryHard→hard, desconocida→easy); signal `tickOutcome` como extensión SOLO de presentación (el motor ya devuelve el outcome).
  - Prioridad de SFX por tick **exited > blocked > advanced** (no encimar sonidos), coherente con "una emisión por tipo" del spec.
  - Assets copiados TAL CUAL (LFS `*.mp3`); atribución de XtremeFreddy visible en créditos por petición del autor.
  - Alcance: cero cambios en `src/domain` y `src/application/services`; el audio observa, nunca escribe; FORGE fuera; catálogos solo +claves.

- **Validación realizada:**
  - `npm test` → **47 suites / 396 tests** (base dev 43/370 → +4 suites, +26 tests; 0 regresiones). El test de paridad exigió las 4 claves nuevas en ambos catálogos.
  - `npx tsc --noEmit` → **0 errores**. ESLint sin errores en archivos G1. Tests con engine mockeado (nunca se reproduce audio real).

#### 📋 Resumen de la sesión
Sistema de audio como proyección de solo lectura: SFX por outcome del motor y en WON/LOST, música en loop por dificultad solo en gameplay (pausa sin reiniciar), mute global + volúmenes independientes persistidos, autoplay tras la primera interacción, robustez total (asset ausente / play() rechazado = no-op silencioso). Assets royalty-free con créditos visibles.

**Notas / follow-ups:**
- Rama **apilada** sobre G3; el PR se abre tras mergear #36, con rebase `--onto origin/dev`.
- **Base de assets** fijada a `/audio` (Vite raíz + Capacitor localhost). Si el build offline usa un `base` no-raíz, prefijar con `BASE_URL` (follow-up menor).
- Sigue pendiente el `docs:` de `gen-uml` + árbol de arquitectura (acumulado G2/G3/G1: nuevos puertos IClock/IAudioPreferences, engine de audio, etc.).
