# 2026-07-08 — Diagnóstico y fix: progreso perdido al volver al mapa tras avanzar de nivel

### 2026-07-08 — Diagnóstico y fix de avance a ciegas al siguiente nivel

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** claude-sonnet-5
- **Autor humano responsable:** @Jrgil20
- **Prompt(s) representativo(s):**
  - "tengo 1 problema en arrowmaze-game que parece que fue introducido por la
    release 1.2 antes si ganaba un nivel tenia que volver al menu y elegia el
    siguiente ahora con la release solo puedo avanzar entre niveles si elijo
    volver al menu tengo que comenzar de cero"
  - "no lo tengo agrega un markdown con eso en docs para analizarlo luego"
- **Salida tomada de la IA:**
  - Diagnóstico: `handleNextLevel` (`src/App.tsx`, agregado en v0.1.2 / PR #29)
    avanzaba al siguiente nivel sin verificar el desbloqueo cuando
    `progressModule` era `null` o `getLocalProgress.getAll()` fallaba
    ("fail open"), mientras `handleBackToSelect` silenciaba ese mismo caso sin
    actualizar `allProgress` — combinado, un fallo real de persistencia local
    se manifestaba como "avanzo entre niveles pero al volver al mapa perdí
    todo el progreso".
  - Fix aplicado en `src/App.tsx`: `handleNextLevel` ahora falla **cerrado**
    (vuelve al mapa) si no puede verificar el desbloqueo, en vez de avanzar a
    ciegas.
  - Documento de investigación `doc/bug-progreso-perdido-siguiente-nivel.md`
    con el diagnóstico completo y los pasos de `adb logcat` pendientes para
    confirmar si hay una falla real de SQLite en el dispositivo del reportante
    (no reproducible en este entorno por falta de dispositivo/emulador).
  - Rama `fix/verificacion-avance-siguiente-nivel` (creada desde `main`, donde
    vive el código de la v0.1.2 — la rama de trabajo activa `feature/login-service`
    se había ramificado antes de esa feature y no la incluía), dos commits
    (`fix:` + `docs:`).
- **Modificaciones manuales del equipo:** Ninguna — la rama está pendiente de
  revisión/push por el autor humano.
- **Validación realizada:** `tsc --noEmit` limpio; suite completa
  `pnpm test` (jest) — 34 suites / 323 tests en verde, sin regresiones.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~10 turnos / ~20 minutos
- **Contexto de la conversación:** Investigar un bug reportado en producción
  (release v0.1.2 del APK offline) donde el progreso de niveles parecía
  perderse al volver al mapa de selección, después de que la nueva función
  "Siguiente nivel →" permitiera saltarse el mapa.
- **Decisiones clave tomadas:**
  - Priorizar la inconsistencia de código verificable (fail-open vs.
    silencioso) sobre especular sobre la causa nativa de SQLite sin evidencia.
  - Aplicar el fix en una rama nueva desde `main` (no desde la rama de trabajo
    activa, que no contenía el código del bug) para no mezclar historiales.
  - Diferir la causa raíz de una eventual falla de persistencia a una sesión
    posterior con acceso a `adb logcat`, dejándola documentada en vez de
    especular en el código.
- **Patrones de uso observados:** Directivo con investigación autónoma — el
  humano describió el síntoma en una frase y aprobó el plan de acción
  propuesto (aplicar fix + documentar) vía pregunta de una sola decisión.
