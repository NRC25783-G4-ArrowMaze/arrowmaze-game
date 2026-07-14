# AI Usage Report: El Hueco al mapa como gran final (umbrales medidos)

**Date:** 2026-07-13  
**ID:** 2026-07-13-el-hueco-al-mapa  
**Author:** Juan David  
**Tool:** Claude Code (CLI)  
**Model:** Claude Fable 5

## Overview
Registro del nivel "El Hueco" (MODO CUBO 6×6, 28 flechas en 4 olas, ya existente en `levelElHueco.ts` como preview dev) en el mapa del juego como GRAN FINAL después de 'cube', con umbrales de estrellas medidos contra el motor real. Ejecutado por fases con OK humano (cambios → diff → playtest → commit).

## Deliverables
- **Archivos modificados:** 6 (`localLevels.ts`, `levelMap.ts`, `localLevels.spec.ts`, `App.tsx`, `i18n/catalogs/es.ts`, `i18n/catalogs/en.ts`)
- **Tests:** 684 → 685 en 85 suites (el caso nuevo es el replay de resolubilidad de el-hueco: 28 taps → WON contra el GameController real); `tsc --noEmit` limpio.

## Areas
- level-design
- i18n
- testing

## Detalles de Implementación

### Registro en el catálogo y el mapa
- `LOCAL_LEVELS['el-hueco'] = LEVEL_EL_HUECO` (sigue disponible como preview dev vía `?level=el-hueco`).
- Nodo final en `LEVEL_MAP`: `prerequisites: ['cube']`, `pathHint {x:50, y:102}` (progresión 96→98→100→102).

### Umbrales medidos (metodología de la casa)
- Flawless real del `EL_HUECO_SOLVE_ORDER` verificado externamente: **1444** → `starThresholds: [1227, 1372]` (~85% y ~95%), documentado en comentario estilo Singularidad. Estrellas ganables.

### Replay como contrato
- Entrada `'el-hueco'` en el `SOLVE_ORDERS` de `localLevels.spec.ts` — la resolubilidad se JUEGA contra el motor en cada corrida de la suite.

### i18n y metadata
- Nombres: es `'El Hueco'`, en `'The Hollow'` (ambos catálogos).
- `LEVEL_METADATA['el-hueco'] = { difficulty: 'veryHard' }` — chip de dificultad y música de G1 para el cierre del juego (aprobado como extra del alcance original).

### Validación
- `npm test` → 685/685 (85 suites); `npx tsc --noEmit` → 0 errores.
- Playtest aprobado por Juan David desde el mapa en dev server.
