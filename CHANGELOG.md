# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado según [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-07-11

Primer release estable: motor de juego completo, persistencia local con
sincronización remota, identidad de usuario, leaderboard, audio, i18n,
temporizador por nivel, tema claro/oscuro, tutorial guiado y editor de mapas
(forge).

### Added
- **Tutorial guiado**: progresión lineal y corazón (13 flechas) como último nivel (#54)
- **Tema oscuro (G4)**: tokens claro/oscuro, cambio en caliente y toggle ☀️/🌙 (#53)
- **Forge**: playtest jugable y opción admin para editar los mapas creados (#60)
- **Términos y uso de datos** en el registro (proyecto académico) (#51)
- **Leaderboard** por nivel (clasificación, trofeo en las cards del selector, overlay con 5 estados) (#46)
- **Auth / cuenta**: UI de login, registro y logout; badge de usuario en el header (#38, #43)
- **i18n**: catálogos ES/EN con paridad de claves, cambio de idioma en caliente, selector en Ajustes (#35)
- **Audio (G1)**: SFX por acción y música de fondo por dificultad, con preferencia de silencio (#37)
- **Temporizador de nivel (G3)**: cronómetro visual mm:ss, se pausa con el flujo de juego (#36)
- Avance directo al siguiente nivel al ganar, sin pasar por el mapa (#29)

### Fixed
- Gate de sesión y scheduler single-flight para la sincronización (#52)
- Ruta del endpoint de login a `/api/v1/auth/login` (#33)
- Ruta del adapter de sincronización de progreso a `/api/v1/progress` (#39)
- Progreso perdido al volver al mapa tras avanzar de nivel (#32)
- Animación de movimiento del tablero: riel persistente, salida voladora, choque recalibrado (#42, #44)
- `manifest.json` inválido tras un merge anterior (#34)

### Changed
- UI responsive y pulido visual del cliente (#49)
- Escala unificada de los glifos de flecha al 55% (`ARROW_SCALE`, `ARROW_GLYPH`) (#40)

---

## [0.1.2] — 2026-07-08

### Added
- Avanzar directo al siguiente nivel al ganar (#29)

---

## [0.1.1] — 2026-07-07

Primer distribuible offline (release `dev → main`).

### Fixed
- UI móvil responsive y legible: header, selector de niveles, overlays, tablero SVG fluido, tema claro fijo con tokens CSS (#28)
- Sincronización post-victoria en el build offline
- Clamp inferior del progreso en animaciones `requestAnimationFrame`
- Compatibilidad del wasm de `sql.js` con el glue empaquetado por `jeep-sqlite`
- El bootstrap ya no bloquea la escena si la persistencia falla o cuelga
- `android/` excluido del lint

---

## [0.1.0] — 2026-07-07

Primera versión etiquetada del cliente: motor de juego (grafo de tablero,
colocación y movimiento de flechas, detección de fin de partida, scoring),
renderizado SVG, animaciones, máquina de estados de flujo (C1), carga de
niveles locales y persistencia local básica.
