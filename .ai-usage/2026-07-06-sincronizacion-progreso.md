### 2026-07-06 — Frontend (Cliente Móvil): Sincronización Bidireccional del Progreso (Offline-First)

* **Herramienta:** Gemini
* **Modelo / versión:** Gemini
* **Autor humano responsable:** @SantiagoChirinos

* **Prompt(s) representativo(s):**
  * "Feature: Sincronización bidireccional del progreso con el servidor remoto... Quiero sincronizar la base de datos SQLite local con la API REST cuando haya conexión..."
  * "me dice que no estamos usando network error, así que voy a quitar la importación en el orquestador"
  * "vamos a usar la fábrica que ya tenemos ya que está estrechamente relacionado con este feature"
  * "supongo que tendremos que poner el url de la api en el .env"
  * "vamos a implementar ademas el token provider, para tener eso de una vez hecho"
  * "me dice __tests__/application/SyncProgress.spec.ts:29:7 - error TS2561: Object literal may only specify known properties, but 'pullProgress' does not exist in type 'Mocked<IProgressApiClient>'. Did you mean to write 'pushProgress'?"

* **Salida tomada de la IA:**
  * `src/core/errors/SyncErrors.ts` [NEW] — Errores de dominio semánticos (`SessionExpiredError`, `NetworkError`) para evitar acoplamiento con códigos HTTP.
  * `src/core/ports/IProgressApiClient.ts` & `IAuthTokenProvider.ts` [NEW] — Puertos para inyección de dependencias de red y autenticación.
  * `src/core/use-cases/SyncProgress.ts` [NEW] — Caso de uso orquestador. Implementa la regla estricta: Upstream primero, Downstream después.
  * `src/infrastructure/api/FetchProgressApiClient.ts` [NEW] — Implementación del cliente HTTP usando `fetch` nativo.
  * `src/infrastructure/auth/CapacitorTokenProvider.ts` [NEW] — Implementación nativa de almacenamiento seguro usando `@capacitor/preferences`.
  * `src/infrastructure/factories/LocalProgressModuleFactory.ts` [MODIFY] — Actualización del *Composition Root* para inyectar el cliente HTTP y el proveedor de tokens.
  * `App.tsx` [MODIFY] — Implementación de la ejecución asíncrona de la sincronización en segundo plano al abrir la app.
  * `tests/core/use-cases/SyncProgress.spec.ts` [NEW] — Suite de pruebas unitarias para el orquestador bidireccional.

* **Modificaciones manuales del equipo:**
  * **Limpieza de dependencias:** Remoción manual de la importación de `NetworkError` en el caso de uso a sugerencia del linter, consolidando el manejo *Offline-First* donde cualquier fallo no-401 se trata silenciosamente.
  * **Corrección estricta de Mocks:** Arreglo del error `TS2561` en la suite de pruebas debido a un desajuste de nombres (`pullProgress` vs `fetchUserProgress`). Esto validó la eficacia de evitar el uso de `any` en los tests usando `jest.Mocked<T>`.
  * **Adaptación a Vite:** Configuración de la variable de entorno con el prefijo obligatorio `VITE_API_BASE_URL` para su inyección segura en el build de React.

#### 📋 Resumen de la sesión
* **Contexto de la conversación:** Desarrollo del motor de sincronización para conectar el almacenamiento local SQLite del cliente móvil (Capacitor) con la API REST remota (NestJS), gestionando conflictos y caídas de red.
* **Decisiones clave tomadas:**
  1. **Orden de Sincronización:** Se determinó que el *Upstream* (subida) siempre debe preceder al *Downstream* (descarga). Así, el servidor resuelve matemáticamente cualquier conflicto de récords antes de que el cliente asimile la "verdad absoluta".
  2. **Persistencia Segura de Tokens:** Se descartó el uso de `localStorage` en favor del plugin nativo `@capacitor/preferences` para evitar que el sistema operativo purgue los tokens en contextos de baja memoria.
  3. **Auto-Sanitización de Sesión:** Si la sincronización en segundo plano detecta un HTTP 401 (`SessionExpiredError`), el sistema aborta el ciclo completo y elimina proactivamente el token revocado del dispositivo.
* **Patrones de uso observados:** Desarrollo iterativo y escalonado (Dominio -> Infraestructura -> Presentación -> Tests). Fuerte atención a las advertencias de compilación de TypeScript para garantizar un código a prueba de fallos de tipado.