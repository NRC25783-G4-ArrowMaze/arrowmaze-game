---
name: verify
description: Verificar cambios de arrowmaze-game en el navegador real (dev server + capturas por viewport)
---

# Verificación runtime de arrowmaze-game

## Lanzar

```bash
npm run dev -- --port 5199 --strictPort   # Vite, listo en <1s
```

Sin backend corriendo, la carga remota de niveles da 404 en consola y cae al
fallback local — es el comportamiento esperado en dev, no un error del cambio.

## Conducir (headless)

No hay playwright en el repo, pero hay un chromium cacheado que sirve con
`playwright-core` (instalarlo en el scratchpad, no aquí):

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/home/jr_g/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell',
});
```

Flujos que cubren la UI del juego:

1. SELECT: cargar `/`, la card focal tiene clase `.level-node-card.focal`.
2. Jugar: click en la focal → tablero en `.board-frame` (medir con
   getBoundingClientRect que no exceda el viewport).
3. Pausa: primer botón de `.app-actions` → `[data-testid="pause-overlay"]`
   (debe cubrir el viewport completo); su 3er botón abre Settings.
4. Overlays de SELECT: botón Account del header → `[data-testid="account-overlay"]`.

Viewports de referencia: 360×640, 640×360 (landscape, el que históricamente
cortaba el tablero), 768×1024, 1366×768, 1920×1080.

## Gotchas

- El tamaño del tablero lo fija `.board-frame` en `src/App.css` con
  `min(100%, calc(100dvh - 190px), 760px)`; `BOARD_SIZE = 560` en GameView es
  solo el viewBox lógico del SVG, no el tamaño en pantalla.
- Los overlays usan `position: fixed`: si un ancestro gana
  `transform`/`filter`, dejan de anclarse al viewport.
