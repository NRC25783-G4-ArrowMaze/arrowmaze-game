### 2026-07-10 — Tutorial guiado, progresión lineal y corazón (13 flechas) como último nivel

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8
- **Autor humano responsable:** @Jrgil20
- **Fase:** feature (presentación / niveles)
- **Feature:** feat/tutorial-y-corazon-nivel3
- **Linked session:** integra el mapa "corazón" (antes solo preview) al flujo de niveles jugables

- **Prompt(s) representativo(s):**
  - "recuerdo tenía un mapa preview, ¿ese lo puedes hacer el nivel 3? y el nivel 1 actual debería ser como un tutorial guiado… una sombra de manito que aparece hasta que le das ahí y solo se carga la primera vez."
  - "no lo hagas el nivel 3, hacedlo el último; además cataloga esos niveles como fáciles y agrega el nombre al i18n que no están."
  - "abre la forge y audita; yo recreo el mapa allí y con eso lo guardas." / "si cambias la flecha al lugar contrario eso funciona, es el forge que está mal hecho."

- **Salida tomada de la IA:**
  - `src/presentation/game/useTutorial.ts` \[NEW\] — hook de la guía: muestra la manito ~1s tras activarse el paso, avanza al jugar la flecha correcta y persiste "visto" al terminar (visibilidad derivada, sin cascadas de setState).
  - `src/presentation/game/tutorial/tutorialScript.ts` \[NEW\] — guion (level-initial, orden `blue → orange → green`, verificado ganador).
  - `src/application/ports/ITutorialPreference.ts` \[NEW\] + `src/infrastructure/tutorial/CapacitorTutorialPreference.ts` \[NEW\] — puerto/adaptador de persistencia con `@capacitor/preferences` (el proyecto no usa localStorage).
  - `src/presentation/components/BoardComponent.tsx` \[MOD\] — prop `hintCell` + marcador SVG (manito 👆 con sombra + anillo pulsante); **y** los puntos se dibujan solo en los nodos reales del grafo (adiós celdas fantasma en mapas dispersos).
  - `src/presentation/components/GameView.tsx` \[MOD\] — cableado del hook (avanza el paso en `onPlayMove`, pasa `hintCell`).
  - `src/App.css` \[MOD\] — `@keyframes tutorial-ring` / `tutorial-tap`.
  - `src/presentation/game/levelMap.ts` \[MOD\] — 6 niveles en cadena lineal; corazón (`heart-preview`) como ÚLTIMO nodo.
  - `src/presentation/game/levels/localLevels.ts` \[MOD\] + `src/presentation/game/levels/levelHeart.ts` \[NEW\] — corazón de 13 flechas (74 celdas) exportado del FORGE como `LevelDataDTO`.
  - `src/App.tsx` \[MOD\] — `LEVEL_METADATA` simplificado a solo `difficulty` (6 niveles "easy").
  - `src/presentation/game/{LevelNodeCard,LevelSelectScreen}.tsx` \[MOD\] + `src/presentation/i18n/catalogs/{es,en}.ts` \[MOD\] — nombres de nivel movidos a i18n (`level.name.*`), renderizados con `t()`.
  - `src/presentation/forge/components/PublishPanel.tsx` \[MOD\] — Exportar/Copiar JSON sin login (solo Publicar/Cargar usan el backend).
  - `__tests__/presentation/tutorialScript.spec.ts` \[NEW\] — juega la secuencia del tutorial por el motor real y exige WON (impide un guion no ganador).

- **Modificaciones manuales del equipo:**
  - El humano **diseñó el mapa del corazón en el editor FORGE** (13 flechas, 74 celdas) y lo exportó como JSON; decidió que fuera el **último** nivel (no el 3.º) y que todos los niveles se cataloguen como "fáciles".
  - Correcciones de rumbo del humano: corazón esquemático de 5 flechas → corazón real de 13 del FORGE; nivel 3 → último nivel; nombres al i18n.

- **Validación realizada:**
  - `npm test` → **546 tests / 67 suites** (0 regresiones); `tsc --noEmit` → 0 errores; `eslint` → limpio.
  - Verificación en navegador headless (playwright): mapa lineal con nombres i18n (es/en), tutorial de la primera partida + persistencia entre sesiones, y el corazón renderizando limpio con el tablero normal.
  - Solver headless sobre el corazón: el motor lo carga sin errores de topología; se detectó que **NO es ganable** (deadlock de flechas centrales que se cruzan) — se documenta como nivel-vitrina final.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** sesión larga, múltiples turnos (≈2–3 h)
- **Contexto de la conversación:** convertir el mapa "corazón" (antes solo preview oculto) en un nivel jugable y añadir un tutorial guiado de la primera partida, con progresión lineal y nombres i18n.
- **Decisiones clave tomadas:** (1) el corazón real (13 flechas del FORGE) va como último nivel; (2) el nivel 1 es un tutorial guiado que solo aparece la primera vez; (3) los puntos del tablero se dibujan solo en nodos reales (arreglo de celdas fantasma).
- **Patrones de uso observados:** directivo/correctivo e iterativo — el humano fijó el alcance con preguntas, diseñó el mapa a mano en el FORGE y corrigió el rumbo varias veces; verificación headless + runtime para no iterar a ciegas.

**Notas / follow-ups:**
- El corazón de 13 flechas no es ganable tal como se exportó (flechas centrales enfrentadas); queda como nivel-vitrina hasta re-orientar flechas en el FORGE.
- Id `2026-07-10-006`.
