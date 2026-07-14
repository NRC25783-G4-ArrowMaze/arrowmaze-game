## 📋 PLAN — Nivel Cube 3D (3x3x3)

### Resumen
Crear el nivel "Cube" (ID: `level-cube`), un grid 3D de 3x3x3 (27 celdas, 3 capas Z) usando `mapMode: "3d"` y `collisionBehavior: "return"`. Insertarlo en la progresión entre `heart-preview` y `singularidad`, y asegurar que tanto él como `singularidad` existan en la semilla del backend.

### Gherkin asociado
features/cube-level.feature — Escenarios de carga del nivel 3D (27 celdas) y verificación de colisión con retorno en caras externas.

### Archivos a crear
- `src/presentation/game/levels/levelCube.ts` — Define `LEVEL_CUBE: LevelDataDTO` con 27 celdas (portCount 6), 5 flechas repartidas en las 3 capas, `mapMode: '3d'` y `collisionBehavior: 'return'`.
- `__tests__/presentation/levels/levelCube.spec.ts` — Test asegurando la validez y metadata estructural del nivel.

### Archivos a modificar
- `src/presentation/game/levels/localLevels.ts` — Exporta `'level-cube': sceneFromLevelData(LEVEL_CUBE)`.
- `src/presentation/game/levelMap.ts` — Añade `'level-cube'` entre `heart-preview` y `singularidad`.
- `src/App.tsx` — Añade `'level-cube': { difficulty: 'hard' }` en `LEVEL_METADATA`.
- `/home/jr_g/Develop/arrowmaze-backend/seeds/levels.seed.json` — Inserta los JSON completos para `level-cube` y `singularidad` para registro.

### Archivos que NO se tocan
- `GameView.tsx`, `BoardComponent.tsx`, `NeonInteractiveBoard.tsx`
- `domain/entities/Arrow.ts`, `domain/entities/Board.ts`, `domain/services/*`

### Orden de implementación (TDD)
1. `__tests__/presentation/levels/levelCube.spec.ts` — Define el test estructural esperado (27 celdas, 5 flechas, collisionBehavior return). Ejecutar pnpm test (rojo).
2. `src/presentation/game/levels/levelCube.ts` — Implementa los datos de `LEVEL_CUBE` hasta pasar el test (verde).
3. `src/presentation/game/levels/localLevels.ts` & `src/presentation/game/levelMap.ts` — Actualiza el registro de niveles y dependencias. Verifica test de progresión lineal en `__tests__/presentation/levelMap.spec.ts` o similares.
4. `src/App.tsx` — Registra la dificultad.
5. `../arrowmaze-backend/seeds/levels.seed.json` — Inserta los datos del Cube y Singularity.

### Riesgos identificados
- Las coordenadas 3D son difíciles de mapear mentalmente. Mitigación: Validar la integridad de IDs (e.g. `"1,1_Z2"`) usando el Forge tras terminar el plan para asegurar jugabilidad.
- Romper el mapa al insertar el nivel. Mitigación: Revisar cuidadosamente la cadena de `prerequisites` en `levelMap.ts`.

### Criterios de completitud
- [ ] Todos los escenarios Gherkin pasan en pnpm test
- [ ] `level-cube` aparece en la UI tras el Heart Preview y su botón de Z-paginación es visible al jugar
- [ ] Backend resiembra `levels.seed.json` exitosamente sin errores de formato
