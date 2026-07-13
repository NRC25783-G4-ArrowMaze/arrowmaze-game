### 2026-07-13 — Implementation: MODO CUBO — tablero 3D sobre la superficie de un cubo

```json
{
  "tool": "claude-code",
  "phase": "implementation",
  "model": "claude-fable-5",
  "feature": "modo-cubo",
  "linked_session": "2026-07-13-forge-3d-view-implementation.md"
}
```

- **Herramienta:** Claude Code (CLI)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David (@Jrgil20)
- **Fase:** implementación (Fases 0–8 de la misión MODO CUBO, dirigidas por fases con OK humano entre cada una)
- **Feature:** modo-cubo (construido SOBRE la fundación H2/forge-3d-view de la rama feat/3dMaps)
- **Linked session:** `2026-07-13-forge-3d-view-implementation.md`

- **Prompt(s) representativo(s):**
  - "MISIÓN MAYOR: implementar el 'MODO CUBO' 3D de ArrowMaze… tablero = superficie de un cubo: 6 caras conectadas por sus 12 aristas (el mapeo arista-a-arista se define como DATO)… dominio y GameController INTACTOS."
  - "APRUEBO el cambio de dominio: los 3 sitios de Arrow.ts pasan a usar el neighborPortIndex que Cell ya almacena."
  - "ARTE v4.x: cubo tipo Rubik de piezas talladas, universo interior de estrellas, el pozo como ventana al cosmos, juice del núcleo por devoradas, explosión de victoria."

- **Salida tomada de la IA:**
  - `src/presentation/game/cube/cubeTopology.ts` \[NEW\] — 6 caras como `layer` 0–5, ids de cruz desplegada, 12 aristas derivadas del embedding 3D (correctas por construcción).
  - `src/presentation/game/cube/cubeRail.ts` \[NEW\] — riel 3D (puerto del modelo 2D parametrizado por nodos): retarget suave adelante/atrás/identidad, snap silencioso, devorado y recoil.
  - `src/presentation/game/cube/cubeRenderModel.ts`, `cubeFaceCanvas.ts`, `cubeCourtesy.ts`, `idleSpin.ts` \[NEW\] — proyección pura viewModel→3D, partición del glifo por caras con snap a la arista y warp a centros visuales, cámara de cortesía, rampa del idle-spin.
  - `src/presentation/input/orbitTapGesture.ts`, `spinInertia.ts`, `tapOcclusion.ts` \[NEW\] — tap vs drag (8px/200ms), inercia con damping, oclusión del tap.
  - `src/presentation/components/BoardComponent3D.tsx` \[NEW\] — renderer three.js: construcción Rubik (piezas interiores/arista/esquineras instanciadas), lienzos CanvasTexture por cara con el glifo 2D, pulso de arista, universo interior (2400 estrellas + núcleo con arco de inestabilidad), pozo shader, devorado, explosión de victoria.
  - `src/domain/entities/Arrow.ts` \[MOD — ÚNICO cambio de dominio, aprobado explícitamente\] — 3 sitios cross-cell pasan de aritmética de puertos opuestos al `neighborPortIndex` que `Cell` ya almacena (implementa la intención documentada en el propio archivo; bit a bit idéntico en niveles 2D, verificado por la suite).
  - `src/application/services/LevelDataBoardBuilder.ts`, `dtos/LevelDataDTOs.ts` \[MOD\] — relax condicional de `validateOppositePorts` para `mapMode` `'3d'`/`'cube'` (estricto en 2D; auto-testeado). Desbloquea de paso el sample H2 de Jesús (ver `doc/cubo-modo_hallazgos.md`).
  - `src/presentation/game/levels/levelCuboSample.ts`, `levelElHueco.ts`, `levelSingularidad.ts`, `devPreviewLevels.ts` \[NEW\] + `localLevels.ts`, `levelMap.ts`, `App.tsx`, `GameView.tsx`, `i18n/catalogs/{es,en}.ts`, `scene.ts` \[MOD\] — niveles cubo (muestra, showcase "El Hueco" de 28 flechas, y "Singularidad" como nivel final del mapa post-Corazón con umbrales de estrellas MEDIDOS contra el motor: flawless 1474 → [1253, 1400]), entrada dev `?level=`, switch de renderer por `mapMode`.
  - `doc/cubo-modo_hallazgos.md` \[NEW\] — 4 hallazgos (2 para Jesús, 1 resuelto con decisión de dominio, 1 pendiente de backend).
  - 10 specs nuevos en `__tests__/` (topología, riel, gestos, inercia, oclusión, render-model, lienzos, cortesía, motor-cubo, niveles) — replays de resolubilidad jugados contra el GameController real.

- **Modificaciones manuales del equipo:**
  - Dirección de arte y de producto turno a turno (Juan David): diseño del modo congelado, 4 iteraciones de arte (Rubik/universo/núcleo), rechazo del trade-off de glifos descentrados, regla de cortesía "solo la última flecha", y aprobación explícita del único cambio de dominio.

- **Validación realizada:**
  - `npx tsc --noEmit` → **0 errores**; `npx eslint src` → **0 problemas**.
  - `npm test` → **678/678 en 85 suites** (base al inicio: 571/71 — cero regresiones; +107 tests nuevos).
  - `npm run build` (producción) → OK.
  - Humo Android (assembleDebug → emulador Pixel_7_API_36, FPS por rAF vía CDP en el WebView, jugando "Singularidad"): **idle 59.3 fps media (p5 59.5, 0 bajones)** · **orbit 59.9 (p5 59.5, 1 bajón/301)** · **slides 60.0 (p5 59.5, 0 bajones/477)** · **explosión 59.7 (p5 59.9, 1 bajón/108, build dev sin minificar = cota inferior)**.

#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** 1 jornada (misión por fases con OK humano entre fases).
- **Contexto de la conversación:** misión mayor sobre la rama `feat/cubo-rubik` (base `origin/feat/3dMaps` @ `5c475f7`); candados: dominio/GameController intocables sin decisión explícita (se ejerció UNA vez, documentada), SVG 2D intacto, cero push.
- **Decisiones clave tomadas:** caras=layers con ids de cruz desplegada y portCount 4; aristas generadas por geometría (embedding único para topología/renderer/riel); riel parametrizado por nodos; regla de diseño "toda flecha muere en agujero o bloqueo" (superficie cerrada); umbrales de estrellas medidos contra el motor (metodología nueva, debut en Singularidad).
