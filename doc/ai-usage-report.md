# AI Usage Report — Arrow Maze (capa de presentación)

Registro auditable del uso de asistencia de IA en la construcción de la capa de
presentación del cliente (B1–B4), sobre un núcleo de dominio/aplicación
preexistente que se mantuvo inmutable. El trabajo se desarrolló en cuatro
sesiones, una por entregable, en orden lógico de dependencia.

---

### 2026-06-19 · 10:20 — B1 · Reestructuración del render del tablero

- **Herramienta:** Claude Code
- **Modelo / versión:** claude-opus-4-8
- **Autor humano responsable:** Juan David
- **Objetivos / directivas representativas:**
  - Reestructurar la capa de render para alinear la interfaz con el diseño de
    referencia (tema claro, grilla de puntos, flechas direccionales), consumiendo
    el núcleo existente sin modificarlo.
  - Integrar la rama consolidada del repositorio y reconstruir la capa de render
    previa por no satisfacer los criterios de diseño, sobre una rama de feature aislada.
- **Salida adoptada de la IA:** `presentation/theme.ts`, `rendering/boardLayout.ts`
  (funciones puras de layout), componentes `BoardComponent` / `CellComponent` /
  `ArrowComponent`, `viewModel.ts` (tipos del view-model desacoplados de los
  componentes) y la especificación `features/board-rendering.feature`.
- **Decisiones de diseño y ajustes del equipo:**
  - Estrategia de ramas: rama de feature derivada de la rama integradora, con
    descarte y reconstrucción íntegra del render conforme a los criterios de diseño.
  - Desacoplamiento de los tipos del view-model en un módulo independiente para
    sostener las fronteras de capa (Clean / Hexagonal) y la verificabilidad.
  - Anclaje de la punta de la flecha a la celda líder, alineando el render con la
    geometría del modelo de avance del motor.
- **Validación realizada:** verificación de tipos (`tsc -b`) sin errores; revisión
  visual del tablero contra el diseño de referencia; revisión humana del hito.
- **Notas de la sesión:** trabajo directivo y supervisado; decisión clave de
  reconstruir el render sobre la rama integradora manteniendo el dominio intacto.

---

### 2026-06-19 · 17:45 — B3 · Enrutamiento de la entrada

- **Herramienta:** Claude Code
- **Modelo / versión:** claude-opus-4-8
- **Autor humano responsable:** Juan David
- **Objetivos / directivas representativas:**
  - Implementar el enrutamiento de la entrada bajo el contrato "una interacción =
    un tick", delegando toda regla de juego al motor (`PlayMoveUseCase`).
  - Unificar la entrada de puntero (mouse/touch/pen), restringir al puntero
    primario y bloquear la entrada en estado terminal o con un movimiento en curso.
- **Salida adoptada de la IA:** `input/{PlayMoveCommand, tapResolver, useBoardInput}.ts`,
  los orquestadores de presentación `game/{scene, sampleLevel, GameController,
  useGameController}.ts`, las utilidades de inversión de coordenadas en
  `rendering/boardLayout.ts` y la especificación `features/input-routing.feature`.
- **Decisiones de diseño y ajustes del equipo:**
  - El adaptador de entrada no evalúa colisiones ni validez: solo traduce el toque
    a una intención dirigida al motor, que decide el resultado.
  - Conformación de la escena de ejemplo a la semántica de avance del motor
    (cabeza en el extremo posterior, cuerpo en sentido de marcha).
- **Validación realizada:** verificación de tipos (`tsc -b`); pruebas de inversión
  coordenada→celda→flecha y de emisión de un único comando por interacción
  (`__tests__/presentation/boardInput.spec.ts`); revisión humana del hito.
- **Notas de la sesión:** énfasis en preservar la frontera de capa — la presentación
  consume el motor únicamente a través de sus casos de uso.

---

### 2026-06-20 · 20:10 — B2 · Retroalimentación animada del tick

- **Herramienta:** Claude Code
- **Modelo / versión:** claude-opus-4-8
- **Autor humano responsable:** Juan David
- **Objetivos / directivas representativas:**
  - Animar el comportamiento real de un tick (avance / bloqueo / destrucción) bajo
    un modelo bloqueante, preservando el determinismo del estado del juego.
  - Definir la animación como capa puramente visual que nunca escribe de vuelta al
    dominio.
- **Salida adoptada de la IA:** `animation/motion.ts` (plan puro por outcome),
  `game/useTickAnimation.ts` (ventana bloqueante), la integración con Web
  Animations API en `ArrowComponent`, el paso de planes en `BoardComponent` y la
  especificación `features/animation_feedback.feature`.
- **Decisiones de diseño y ajustes del equipo:**
  - Invariante de determinismo: el estado final renderizado es idéntico con o sin
    animaciones; la capa visual solo lee el resultado que el motor ya decidió.
  - Coreografías diferenciadas por outcome (deslizamiento, retroceso elástico,
    desvanecimiento) parametrizadas desde el mapeo puerto→dirección del render.
- **Validación realizada:** verificación de tipos (`tsc -b`); pruebas del plan de
  animación por outcome y del invariante de determinismo
  (`__tests__/presentation/animation.spec.ts`); revisión humana del hito.
- **Notas de la sesión:** decisión clave de modelar la animación sin efectos sobre
  el estado del juego para garantizar reproducibilidad.

---

### 2026-06-21 · 11:30 — B4 · Fin de partida e integración

- **Herramienta:** Claude Code
- **Modelo / versión:** claude-opus-4-8
- **Autor humano responsable:** Juan David
- **Objetivos / directivas representativas:**
  - Establecer la condición de fin de partida (indicador de movimientos, overlay de
    resultado y bloqueo de entrada) como proyección del estado de la sesión.
  - Consolidar la integración de las cuatro capacidades y validar el conjunto.
- **Salida adoptada de la IA:** `components/GameOverlay.tsx` e integración en
  `App.tsx`.
- **Decisiones de diseño y ajustes del equipo:**
  - El overlay y el bloqueo de entrada se derivan exclusivamente del estado de la
    sesión (en curso / ganada / perdida); el alcance de vidas, pantalla de inicio y
    pistas se excluye por corresponder a otro grupo de trabajo.
- **Validación realizada:** verificación de tipos (`tsc -b`) sin errores; análisis
  estático (ESLint) sin hallazgos en la capa de presentación; suite completa con
  208 pruebas en verde (una suite preexistente del motor, ajena a este trabajo,
  queda señalada como rota para su corrección); revisión humana del hito.
- **Notas de la sesión:** cierre del alcance B1–B4; el dominio y la aplicación
  permanecieron inmutables durante toda la iniciativa.

---

#### 📋 Resumen general
- **Modalidad de trabajo:** entrega incremental por fases con validación en cada
  hito antes de avanzar.
- **Contexto:** construcción de la capa de presentación (diseño de referencia,
  interacción, animación y cierre de partida) sobre un núcleo preexistente.
- **Decisiones clave:** reconstrucción del render sobre la rama integradora; consumo
  del motor exclusivamente desde presentación con el dominio inmutable; animaciones
  como capa visual determinista.
- **Patrón de uso observado:** directivo y supervisado, con definición de alcance y
  restricciones de arquitectura por parte del responsable y revisión por fases.
