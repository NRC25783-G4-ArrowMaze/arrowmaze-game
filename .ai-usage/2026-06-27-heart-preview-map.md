# AI Usage Report — Mapa de preview con forma de corazón (grafo, jugable)

### 2026-06-27 — Mapa de preview "corazón": tablero-grafo esquemático y resoluble

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8
- **Autor humano responsable:** @Jrgil20
- **Fase:** implementation (capa de presentación)
- **Feature:** `heart-preview-map`
- **Linked session:** 2026-06-27-001 (animación del slide/recoil del preview)
- **Rama:** `feature/animaciones`

- **Prompt(s) representativo(s):**
  - "ahora necesito un mapa de preview más grande con como el de la imagen" (icono: corazón de flechas)
  - "algunas flechas green apuntan hacia dentro además de hacia afuera, además veo que lo dibujas casi como una matriz en vez de un grafo que es lo que debería ser"
  - (vía AskUserQuestion) Propósito = **Jugable y resoluble**; Fidelidad = **Esquemático**

- **Salida tomada de la IA:**
  - `src/presentation/preview/heartScene.ts` (nuevo) — helper `buildHeartScene` que arma un tablero-**grafo** (solo los nodos del corazón, conectados a sus vecinos E/S existentes; **no** una matriz rectangular) a partir de "caminos" `[col,row]`, validando adyacencia y solapamientos y derivando head/body/exitPort. Diseño `HEART_PATHS`: 5 flechas (colores del icono) que trazan dos lóbulos, escote central y punta.
  - `src/presentation/preview/NeonInteractiveBoard.tsx` (modificado) — usa `HEART_SCENE`; dibuja los puntos **solo en los nodos reales** del grafo (no en un rectángulo de fondo); lienzo a 600px.

- **Decisiones de implementación:**
  - **Grafo, no matriz:** la escena solo contiene los nodos del corazón; las conexiones son entre nodos adyacentes existentes. Corrige el enfoque inicial (grilla rectangular 12×11 totalmente conectada).
  - **Direcciones coherentes → resoluble:** todas las flechas apuntan hacia afuera (lóbulos al N, centro al S), de modo que cada una se desliza hasta salir y el tablero queda vacío (WON).
  - **Verificación de resolubilidad headless:** un solver DFS (memoizado por firma de estado) confirmó que el nivel se resuelve en 5 slides antes de tocar el navegador.

- **Modificaciones manuales del equipo:**
  - El autor corrigió dos veces el rumbo: (1) "es una matriz, debería ser un grafo" → se rehízo el helper para generar solo nodos del corazón; (2) "flechas que apuntan hacia dentro y afuera" → se rediseñó para que todas apunten hacia afuera.
  - El autor fijó el alcance vía preguntas: **jugable/resoluble** + **esquemático** (no réplica fiel del icono).

- **Validación realizada:**
  - `tsc --noEmit -p tsconfig.app.json`: exit 0.
  - **Solver headless:** SOLVABLE en 5 (`yellow → green → white → magenta → orange`); 26 nodos, 5 flechas.
  - **Runtime (preview, navegador):** reproducida esa secuencia clicando las flechas → el tablero se vacía (5→0) y el estado llega a **WON** (movimientos 99→94). Sin errores de consola en montaje fresco.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** continuación de la sesión de animaciones (varios turnos)
- **Contexto de la conversación:** construir un mapa de preview grande con forma de corazón (como el icono), como tablero-grafo y nivel resoluble.
- **Decisiones clave tomadas:** (1) tablero-grafo en vez de matriz; (2) flechas hacia afuera para garantizar resolubilidad; (3) corazón esquemático verificado con un solver antes del navegador.
- **Patrones de uso observados:** correctivo/iterativo — el autor ajustó el enfoque conceptual (grafo) y la coherencia de direcciones; se usó verificación headless + runtime para no iterar a ciegas.
