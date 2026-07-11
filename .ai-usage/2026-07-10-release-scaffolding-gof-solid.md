### 2026-07-10 — LICENSE, CHANGELOG, bump de versión y GoF/SOLID en README

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Opus 4.8 (1M context)
- **Autor humano responsable:** Juan David
- **Fase:** docs (infraestructura de release)
- **Feature:** docs/verification-checklist-v1 (continuación de la misma rama)
- **Linked session:** [[2026-07-10-verification-checklist-v1]] — segunda tanda de la Fase 1, priorizando los puntos 🔴/🟡 del roadmap de esa checklist

- **Prompt(s) representativo(s):**
  - "le daré prioridad a: LICENSE (mit está bien) · CHANGELOG.md (no sé el objetivo de esto) · Bump de versión · GoF + SOLID en README con snippets reales, y embeber diagramas"

- **Salida tomada de la IA:**
  - `LICENSE` \[NEW\] — MIT, copyright `NRC25783-G4-ArrowMaze` 2026.
  - `CHANGELOG.md` \[NEW\] — formato Keep a Changelog; historial `v0.1.0` → `v1.0.0` reconstruido a partir de `git log` real por rango de tags (`v0.1.0..v0.1.1`, `v0.1.1..v0.1.2`, `v0.1.2..dev`), no inventado.
  - `package.json` \[MOD\] — `version` `0.1.2` → `1.0.0`.
  - `android/app/build.gradle` \[MOD\] — segunda fuente de versión detectada (`versionName`/`versionCode`), análoga a `swagger.ts` en el backend; actualizada en el mismo paso para no dejarla desincronizada.
  - `README.md` \[MOD\] — nuevas secciones `## Design Patterns (GoF)` (Factory Method `LocalProgressModuleFactory`, Adapter `FetchProgressApiClient`, State/autómata de pila `GameFlowController`) y `## SOLID en el código` (tabla S/O/L/I/D con evidencia real + snippet de `ILocalProgressRepository`), más `## Diagrama de clases` referenciando el SVG embebido; sección "Licencia" actualizada de "privado, todos los derechos reservados" a MIT.
  - `doc/classes.svg` \[NEW\] — exportado localmente desde `classes.puml` usando el `plantuml.jar` vendorizado por la dependencia `node-plantuml` (sin conexión a internet ni PlantUML online), 120 clases/interfaces renderizadas.
  - `doc/VERIFICATION_CHECKLIST.md` \[MOD\] — secciones 6, 10, 12 y el roadmap final actualizados marcando estos puntos como resueltos.

- **Modificaciones manuales del equipo:**
  - El usuario pidió una explicación del propósito de `CHANGELOG.md` antes de aprobar su creación (no tenía claro para qué servía); se explicó (Keep a Changelog, trazabilidad de qué entra en cada versión) y se generó igual, dejando la opción de descartarlo si no lo consideraba útil.
  - El usuario confirmó explícitamente MIT como licencia antes de crear el archivo.
  - Se descubrió en el camino que había una segunda fuente de versión (`android/app/build.gradle`) no mencionada en la checklist original; se decidió corregirla también en el mismo paso, siguiendo el patrón ya usado en el backend (`swagger.ts`).

- **Validación realizada:**
  - `pnpm test` → **531 tests / 64 suites**, 0 fallos, corriendo ya con `arrowmaze-game@1.0.0` en `package.json`.
  - Verificación de que el SVG generado no contenía un error de sintaxis de PlantUML (falsa alarma inicial: un grep de "error" matcheaba nombres reales de clases como `SyncErrors`/`ProgressErrors`, no un fallo de render) — se confirmó contando 120 ocurrencias reales de `class`/`interface` en el SVG.
  - Revisión manual del `CHANGELOG.md` contra `git log --oneline` por rango de tags para no inventar entradas.

#### 📋 Resumen de la sesión
Segunda tanda de la Fase 1 de preparación del release v1.0.0: se resolvió toda la infraestructura de release que dependía de decisiones simples del usuario (licencia, changelog, versión) y la documentación de patrones de diseño que ya existían en el código pero no estaban explicados en el README (GoF + SOLID con snippets reales, más el diagrama de clases embebido usando herramientas ya vendorizadas en el proyecto, sin depender de conexión a internet). Con esto, del roadmap 🔴/🟡 de la checklist solo queda pendiente el CI (`.github/workflows/ci.yml`); todo lo demás crítico/importante quedó resuelto en esta rama.

**Notas / follow-ups:**
- Sigue pendiente: `.github/workflows/ci.yml`, `AI_USAGE.md` en raíz (o validar que `.ai-usage/README.md` cumple), y la promoción `dev → main` + tag `v1.0.0` + GitHub Release con APK.
- El diagrama de capas hexagonales (distinto del diagrama de clases) sigue sin existir como artefacto dedicado.
