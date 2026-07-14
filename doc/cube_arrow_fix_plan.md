## 📋 PLAN — Topología 3D Cinemática en Arrow.ts

### Resumen
Actualmente `Arrow.ts` calcula el puerto opuesto de manera estricta con la fórmula matemática `(port + P/2) % P`. Esta fórmula produce direcciones erróneas en mallas 3D (6 puertos) donde los opuestos son los pares (0↔2), (1↔3) y (4↔5). Este plan abstrae la obtención del puerto opuesto para que las colas de las flechas se muevan correctamente y las cabezas mantengan el momentum correcto tras encogerse.

### Gherkin asociado
features/cube_arrow_fix.feature — Verifica el cálculo del exitDir y exitPort en escenarios 2D y 3D.

### Archivos a crear
- Ninguno

### Archivos a modificar
- `src/domain/entities/Arrow.ts` — 
  - Se añadirá el método privado estático o de instancia `_getOppositePort(port: number, portCount: number): number`.
  - Se modificará el cálculo del `exitDir` del Tail (aprox línea 289) para usar `_getOppositePort`.
  - Se modificará el cálculo del momentum de la cabeza (aprox línea 419) para usar `_getOppositePort`.

### Archivos que NO se tocan
- `src/presentation/game/levels/levelCube.ts`
- Ningún archivo de `src/presentation` ni renders.
- Resto de entidades de `domain/entities`.

### Orden de implementación (TDD)
1. Escribir tests en `__tests__/domain/Arrow.spec.ts` que fuercen la validación del método privado o expongan el comportamiento erróneo (simulando una celda de 6 puertos con una Tail apuntando).
2. Implementar `_getOppositePort` en `Arrow.ts`.
3. Ejecutar y validar que `pnpm test __tests__/domain/Arrow.spec.ts` pasa exitosamente.
4. Ejecutar el test de integración para el cubo: `pnpm test __tests__/presentation/levelCube.spec.ts` para verificar que la flecha `rose` u otras serpientes avanzan y se destruyen en los sumideros sin chocar consigo mismas.

### Riesgos identificados
- **Romper las direcciones en 2D**: La implementación debe tener un fallback explícito al cálculo cíclico `(port + Math.floor(portCount / 2)) % portCount` para cuando `portCount !== 6`.

### Criterios de completitud
- [ ] Los escenarios de Gherkin pasan como tests.
- [ ] `pnpm test __tests__/presentation/levelCube.spec.ts` debe pasar completamente (lo que indica que la cinemática de las serpientes 3D ya fluye limpiamente).
- [ ] No hay `any` tipado ni suposiciones en la refactorización de `Arrow.ts`.
