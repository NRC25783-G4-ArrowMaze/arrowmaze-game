# Bug: progreso perdido al volver al mapa (post release v0.1.2)

## Síntoma reportado

> Antes, si ganaba un nivel tenía que volver al menú y elegía el siguiente.
> Ahora, con la release, solo puedo avanzar entre niveles (sin volver al
> menú). Si elijo volver al menú, tengo que comenzar de cero.

Reportado sobre el APK offline (`build:apk`), release `v0.1.2`.

## Diagnóstico

`v0.1.2` (PR #29, `feat: avanzar directo al siguiente nivel al ganar`) agregó
el botón **"Siguiente nivel →"** al overlay de victoria (`handleNextLevel` en
`src/App.tsx`). Antes de esa release, la única forma de progresar era volver
al mapa (C3), que deriva el estado de cada nodo desde `allProgress`
(`LevelSelectionProjection.project`, alimentado por
`progressModule.getLocalProgress.getAll()`).

`handleNextLevel` tenía un fallo de diseño: si no podía verificar el
desbloqueo del siguiente nivel (`progressModule === null`, o
`getLocalProgress.getAll()` lanzaba), **avanzaba igual** ("fail open") en vez
de bloquear el avance. Mientras tanto, `handleBackToSelect` recarga el
progreso con `progressModule?.getLocalProgress.getAll()` — si el módulo es
`null`, esa llamada es un no-op silencioso y `allProgress` nunca se actualiza.

Combinando ambas cosas: si en un dispositivo la persistencia local (SQLite vía
`@capacitor-community/sqlite`) no está guardando de verdad, el jugador puede
seguir "avanzando" nivel a nivel con el botón nuevo sin que nada se note,
pero en cuanto vuelve al mapa, este se recalcula desde cero y todo aparece
bloqueado — exactamente el síntoma reportado.

**Ya corregido** en la rama `fix/verificacion-avance-siguiente-nivel`
(commit `9b030b05`): `handleNextLevel` ahora falla **cerrado** — si no puede
verificar el desbloqueo, vuelve al mapa en vez de avanzar a ciegas. Esto hace
visible de inmediato cualquier fallo real de persistencia (el jugador queda
atascado en el mapa) en vez de dejarlo avanzar y "perder" el progreso después.

## Pregunta abierta: ¿por qué fallaría la persistencia?

El código de persistencia (`CapacitorSqliteDriver`,
`SqliteProgressRepository`, `LocalProgressModuleFactory`) **no cambió** entre
`v0.1.1` y `v0.1.2` — si funcionaba en 1.1, en teoría debería seguir
funcionando en 1.2. El fix de arriba resuelve la inconsistencia de
navegación, pero no explica una posible falla real de SQLite en el
dispositivo del reportante. No se pudo reproducir en este entorno (sin
`adb`/dispositivo/emulador conectado).

## Cómo recolectar evidencia (pendiente, sin dispositivo disponible)

Con el APK instalado y el dispositivo conectado por USB (depuración USB
activada):

```bash
adb logcat | grep -E "CapacitorSqliteDriver|LocalProgressModuleFactory|GameView|App\]"
```

Pasos para reproducir mientras se captura el log:

1. Abrir la app (capturar si aparece `[LocalProgressModuleFactory] Fallo
   crítico al ensamblar el módulo` — indica que `progressModule` nunca se
   inicializó).
2. Jugar y ganar "Nivel Inicial". Buscar `[GameView] Progreso local guardado
   para el nivel level-initial` (confirma que el `INSERT` se ejecutó) vs.
   `[GameView] Error guardando o sincronizando el récord` (confirma que
   falló).
3. Tocar "Volver al mapa" (o el nuevo botón "Siguiente nivel →" y luego
   volver). Verificar si el nivel aparece como `completado` o vuelve a
   `bloqueado`.

### Interpretación de resultados

| Log observado | Causa probable |
|---|---|
| `Fallo crítico al ensamblar el módulo` en el arranque | El plugin nativo de SQLite no inicializa en este dispositivo/build (revisar registro del plugin en `android/`, permisos, o si el APK realmente empaqueta `@capacitor-community/sqlite` nativo). |
| `Progreso local guardado` se loguea, pero el mapa igual muestra todo bloqueado | El `INSERT` se ejecuta pero no persiste entre sesiones/pantallas — revisar si `createConnection`/`retrieveConnection` en `CapacitorSqliteDriver.openDatabase` está abriendo una conexión distinta cada vez, o si `_isWeb` se está evaluando mal en ese build. |
| Ningún log de `[GameView]` ni `[App]` relacionado con progreso | Puede ser que el APK probado sea uno anterior a este fix, o que el build offline no esté usando esta ruta de código — confirmar versión/commit del APK instalado. |
| No se reproduce con estos logs (todo guarda y persiste bien) | El fix de "fail closed" ya alcanza — el síntoma original probablemente era la ventana de "fail open" enmascarando algo transitorio (p. ej. una carrera puntual), no un fallo sistemático de SQLite. |

## Archivos relevantes

- `src/App.tsx` — `handleNextLevel`, `handleBackToSelect` (ya corregido).
- `src/infrastructure/persistence/sqlite/CapacitorSqliteDriver.ts`
- `src/infrastructure/persistence/sqlite/sqliteProgressRepository.ts`
- `src/infrastructure/factories/LocalProgressModuleFactory.ts`
- `src/domain/services/LevelSelectionProjection.ts`
