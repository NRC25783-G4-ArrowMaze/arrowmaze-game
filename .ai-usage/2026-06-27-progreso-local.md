### 2026-06-27 — Frontend (Cliente Móvil): Persistencia Local del Progreso (Offline-First)

* **Herramienta:** Gemini

* **Modelo / versión:** Gemini

* **Autor humano responsable:** @SantiagoChirinos

* **Prompt(s) representativo(s):**

  * "Feature: Persistencia local del progreso y puntuaciones del jugador en SQLite... Quiero almacenar el progreso, puntuaciones y métricas en una base de datos local SQLite"

  * "tengo un value object en el front que es score, debería ponerlo en local record o es mejor dejarlo como number..."

  * "pero si local record va en infraestructura tenemos un problema aca... porque estamos acoplando dominio a infraestructura"

  * "me dice This syntax is not allowed when 'erasableSyntaxOnly' is enabled.ts(1294)"

  * "estamos usando vite + capacitor"

  * "vamos a evitar poner tanto código en el app.tsx, vamos a poner la inicialización de la base de datos en una factory"

* **Salida tomada de la IA:**

  * `Gherkin: Persistencia Local` \[NEW\] — Contrato oficial con reglas de *High Score* y bandera técnica `pendingSync`.

  * `src/core/entities/LevelProgress.ts` \[NEW\] — Entidad histórica analítica con reglas de desempate puras (Cascade Sorting), separada de la entidad activa `GameSession`.

  * `src/core/ports/ILocalProgressRepository.ts` \[NEW\] — Puerto de dominio estrictamente desacoplado de la infraestructura.

  * `src/core/use-cases/SaveLocalProgress.ts` \[NEW\] — Orquestador de la regla de negocio para el guardado local.

  * `src/infrastructure/persistence/sqlite/` \[NEW\] — Adaptador nativo para `@capacitor-community/sqlite`, Mapeador DTO-Entidad y Repositorio SQLite.

  * `src/infrastructure/factories/LocalProgressModuleFactory.ts` \[NEW\] — Composition Root asíncrono para abstraer la inicialización nativa.

  * `App.tsx` \[MODIFY\] — Integración del módulo local con `useEffect` atado al estado `WON` del motor del juego.

  * Suites de Pruebas (Jest) \[NEW\] — Cobertura unitaria de la regla en cascada y del caso de uso orquestador, manteniendo la política *Zero-Any*.

* **Modificaciones manuales del equipo:**

  * **Inversión de Dependencias Estricta:** Reescritura del puerto `ILocalProgressRepository` tras detectar que devolvía un modelo de persistencia (Infraestructura) en lugar de un objeto del Dominio, protegiendo los límites arquitectónicos.

  * **Cumplimiento de Entorno de Ejecución:** Remoción de *Parameter Properties* (`private readonly` en constructores) en `LevelProgress` para cumplir con la restricción `erasableSyntaxOnly` del compilador de Node.js actual.

  * **Refactorización de Presentación:** Extracción de la lógica de conexión SQLite nativa de `App.tsx` hacia una fábrica especializada (`LocalProgressModuleFactory`) y resolución de advertencias de linter al consumir el módulo mediante un efecto Reactivo ligado al estado del juego.

* **Validación realizada:** Pruebas unitarias de la entidad y el caso de uso en verde. Verificación de tipados estrictos en los *mocks* sin uso de `any`.

#### 📋 Resumen de la sesión

* **Contexto de la conversación:** Desarrollo del sistema de guardado local para el cliente del juego (Vite + Capacitor), garantizando que funcione *offline* y preparándolo para una futura sincronización.

* **Decisiones clave tomadas:**

  1. **Separación de Entidades:** Creación de `LevelProgress` (Histórico) para no sobrecargar de responsabilidades a `GameSession` (Activo).

  2. **Bandera Técnica Aislada:** Inclusión de `pendingSync` en el DTO de infraestructura para gestionar el estado *Offline-First* sin que la capa de dominio sea consciente de la red.

  3. **Inyección de Dependencias Asíncrona:** Uso de una Fábrica de Módulo para resolver la promesa de inicialización de Capacitor SQLite antes de entregar los casos de uso a la capa de React.

* **Patrones de uso observados:** Diálogo proactivo para identificar fugas de infraestructura hacia el dominio, adaptación inmediata a restricciones de sintaxis del compilador TypeScript y fuerte énfasis en la separación de responsabilidades en React.