### 2026-07-07 — Frontend (Cliente Móvil): Inicio de Sesión de Usuario (Autenticación)

* **Herramienta:** Gemini
* **Modelo / versión:** Gemini
* **Autor humano responsable:** @SantiagoChirinos

* **Prompt(s) representativo(s):**
  * "vamos a programar el servicio de login"
  * "me dice Property 'setToken' does not exist on type 'IAuthTokenProvider'. Did you mean 'getToken'?ts(2551)"
  * "tambien me dice 'InvalidCredentialsError' is declared but its value is never read.ts(6133)"
  * "vamos a realizar los tests"

* **Salida tomada de la IA:**
  * `src/application/errors/AuthErrors.ts` \[NEW\] — Error de dominio `InvalidCredentialsError` para abstraer el código HTTP 401.
  * `src/application/ports/IAuthApiClient.ts` \[NEW\] — Contrato del cliente de red exclusivo para el inicio de sesión.
  * `src/application/ports/IAuthTokenProvider.ts` \[MODIFY\] — Actualización de la interfaz para incluir explícitamente las firmas de `setToken` y `removeToken`.
  * `src/application/services/LoginUser.ts` \[NEW\] — Orquestador del inicio de sesión (Aplicación) que delega la autenticación y la persistencia segura.
  * `src/infrastructure/api/FetchAuthApiClient.ts` \[NEW\] — Adaptador del cliente HTTP (fetch) con un DTO estricto (`LoginResponseDTO`).
  * `__tests__/application/LoginUser.spec.ts` \[NEW\] — Pruebas unitarias para el caso de uso validando el flujo de éxito y de propagación de errores.

* **Modificaciones manuales del equipo:**
  * **Ajuste Estricto de Contratos:** Incorporación de las firmas `setToken` y `removeToken` en `IAuthTokenProvider` tras detectar una violación de interfaz (TS2551), protegiendo la Inversión de Dependencias.
  * **Optimización de Imports:** Eliminación manual de la importación de `InvalidCredentialsError` en el caso de uso a sugerencia del linter (TS6133), permitiendo que el error "burbujee" naturalmente hacia la capa de presentación (React).
  * **Simplificación de DTOs:** Remoción de la propiedad redundante de estado (`success`) en el payload de respuesta de la API, delegando la validación del éxito a los códigos de estado HTTP nativos (200 OK).

#### 📋 Resumen de la sesión
* **Contexto de la conversación:** Desarrollo del módulo de inicio de sesión en el cliente móvil, conectando el flujo de autenticación con el proveedor nativo de tokens de Capacitor previamente establecido.
* **Decisiones clave tomadas:**
  1. **Aislamiento del Dominio:** Se validó que la entidad del usuario no necesita existir en el cliente móvil para esta etapa; la autenticación se trata puramente como un mecanismo de obtención de credenciales a nivel de infraestructura y aplicación.
  2. **Delegación de Errores a la UI:** El caso de uso `LoginUser` se diseñó para no capturar los errores de negocio o de red, propagándolos directamente para que el componente de React sea el responsable final de la retroalimentación visual al jugador.
* **Patrones de uso observados:** Alta sensibilidad a las reglas del compilador de TypeScript y linters, resolviendo errores de contratos e importaciones en tiempo real para asegurar que el código mantenga la política de tipado estricto (*Zero-Any*).
