# MODO CUBO — Hallazgos de Fase 0/1 (rama `feat/cubo-rubik`, base `origin/feat/3dMaps` @ `5c475f7`)

Registro de hallazgos sobre la fundación H2 (mapas 3D) descubiertos al construir
el MODO CUBO encima. Los dos primeros son para reportar a Jesús (dueño de H2);
el tercero es la decisión de dominio pendiente del MODO CUBO.

---

## Hallazgo 1 — `LEVEL_3D_SAMPLE` revienta si se juega (RESUELTO de paso por el relax condicional)

**Qué pasaba:** `LevelDataBoardBuilder.validateOppositePorts` exige
`toPort === (fromPort + portCount/2) % portCount`. Con `portCount: 6` el
"opuesto" de 2 es 5 y el de 4 es 1, así que TODAS las conexiones del sample 3D
(planares `2→0` e inter-capa `4→5`) lanzaban `ConnectionError` al construir el
Board. Nunca se notó porque el sample solo se carga en el Forge
(`PublishPanel.tsx` — botón "Cargar Muestra 3D") y jamás pasó por el motor.

**Estado:** resuelto de paso por el relax condicional del MODO CUBO
(aprobado por Juan David, Fase 0): el builder mantiene la regla estricta con
`mapMode` ausente o `'2d'` y omite solo la comprobación geométrica de opuestos
con `'3d'`/`'cube'`. Cubierto por
`__tests__/application/LevelDataBoardBuilderRelax.spec.ts` (incluye el caso
exacto del contrato H2: `2→0` y `4→5` con `portCount: 6` ahora construyen).

## Hallazgo 2 — La guía 3D recomienda IDs que rompen el parser (PENDIENTE, no tocado)

**Qué pasa:** `doc/3d_maps_guide.md` (§3) recomienda sufijar ids como
`"0,0_Z1"` para celdas de capas superiores, pero `sceneFromLevelData`
(`src/presentation/game/scene.ts`) hace `id.split(',').map(Number)` y lanza
`Error` si el id no parsea como `"col,row"` — `Number("0_Z1")` es `NaN`.
Cualquier nivel que siga la guía revienta al deserializar.

**Estado:** NO tocado (fuera del alcance del MODO CUBO; la guía es doc de
Jesús). El propio `levelMapa3dSample.ts` evita el problema usando ids
`"col,row"` con bloques desplazados por capa — esa convención sí es segura, y
es la que adopta el MODO CUBO (cruz desplegada).

## Hallazgo 3 — El dominio asumía cableado de puertos opuestos al cruzar celdas (RESUELTO — cambio de dominio aprobado por Juan David en Fase 1)

**Qué pasa:** `Cell` almacena el puerto remoto de cada conexión
(`getConnection().neighborPortIndex`), pero `Arrow` lo ignora en tres puntos y
deduce el puerto del otro lado con aritmética de opuestos
`(puerto + portCount/2) % portCount`, que solo es válida cuando el cableado es
de puertos opuestos (toda rejilla plana):

| Sitio | Qué hace | Estado en el cubo |
|---|---|---|
| `Arrow.ts:139` (`extend`) | entryPort del nuevo segmento = opuesto del puerto de salida **de la celda anterior** | Incorrecto en aristas dobladas |
| `Arrow.ts:349` (`_commitAdvance`) | entryPort reconstruido igual que arriba | Incorrecto en aristas dobladas |
| `Arrow.ts:332/371` (Step C, cabeza solitaria) | la cabeza conserva el **número** de puerto de la celda vieja | Incorrecto en aristas dobladas |
| `Arrow.ts:287` (cola) | salida = opuesto del entryPort **de la misma celda** | Correcto siempre (regla local "sigue recto") |

**Evidencia (motor real, mini-cubo 3×3):** una cabeza que sube por la cara de
arriba y cruza a la de atrás por la arista cableada `0↔0` llega bien a `10,3`
(tick 1) y en el tick 2 **rebota a `4,0`** en vez de continuar a `10,4`.
Es matemáticamente imposible cablear las 12 aristas del cubo solo con pares
opuestos (en cada vértice concurren 3 aristas mutuamente adyacentes que
exigirían 3 "colores" N-S/E-O y solo hay 2), así que el caso no es evitable
con datos.

**Resolución (aprobada por Juan David, Fase 1, TDD):** en los tres sitios
cross-cell la flecha usa ahora el dato que el dominio ya guardaba:
`neighborPortIndex` de la conexión real. La fórmula de la cola (`Arrow.ts`,
salida = opuesto del entryPort en la MISMA celda) queda tal cual — es local y
correcta en cualquier topología. Para todo nivel 2D el builder garantiza
cableado opuesto, por lo que `neighborPortIndex === opuesto numérico` y el
comportamiento es bit a bit idéntico: los 595 tests previos siguieron verdes
sin tocar ninguno. No fue una regla nueva: `Arrow.ts` ya documentaba la
intención ("exitPort = opposite of its entryPort in new cell") sin
implementarla. Cobertura nueva: cruce doblado 0↔0, cuerpo colocado a través
del pliegue, y los tres anillos ortogonales que recorren las 12 aristas
(`__tests__/presentation/cubeEngine.spec.ts`).

## Hallazgo 4 — 'singularidad' no existe en el backend (PENDIENTE — coordina Juan David)

El nivel final del mapa ('singularidad', MODO CUBO, post-Corazón) vive solo en
el catálogo local. En modo ONLINE la escena se pide a la API
(`GET /api/v1/levels/:id`) y este id no está en el seed del backend → caería
al fallback local igual que cualquier nivel sin respuesta. El APK OFFLINE y el
modo dev lo juegan completo. Pendiente: registrar el nivel en el backend
(seed/admin) para online y leaderboards sin 404 — lo coordina Juan David.
