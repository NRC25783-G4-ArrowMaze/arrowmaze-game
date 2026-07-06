# language: es
Característica: Interfaz API REST para Autenticación y Sesión de Usuarios
  Como cliente consumidor de la API (Frontend / Móvil)
  Quiero interactuar con endpoints estandarizados de registro, login y logout
  Para gestionar el acceso de los usuarios utilizando una arquitectura de token único (7 días)

  ───────────────────────────────────────────── CONCEPTOS CLAVE

  Endpoint : Ruta HTTP expuesta por el servidor
  Payload : Cuerpo de la petición o respuesta (en formato JSON)
  Auth Header : Cabecera HTTP "Authorization" con el formato "Bearer <token>"
  Status Code : Código HTTP que representa el resultado de la operación

  ─────────────────────────────────────────────

  Antecedentes:
    Dado que la API acepta y responde estrictamente con "application/json"
    Y todas las rutas de autenticación operan bajo el prefijo "/api/v1/auth"

  ══════════════════════════════════════════════ BLOQUE 1 — REGISTRO DE USUARIO (POST /register) ══════════════════════════════════════════════

  Escenario: Registro exitoso con datos válidos
    Cuando realizo una petición POST a "/api/v1/auth/register" con el payload:
      """
      {
        "email": "nuevo@usuario.com",
        "password": "Password123!"
      }
      """
    Entonces la API responde con el código de estado HTTP 201 (Created)
    Y la respuesta contiene el campo "message" con el valor "Account created successfully"
    Y la respuesta NO incluye la contraseña, ni su hash, ni datos sensibles de la cuenta

  Escenario: Fallo de registro por errores de validación en el payload
    Cuando realizo una petición POST a "/api/v1/auth/register" con una contraseña que no cumple las políticas
    Entonces la API responde con el código de estado HTTP 400 (Bad Request)
    Y la respuesta contiene un campo "error" detallando la regla no cumplida
      (ej. "password must contain at least 8 characters, 1 number, and 1 uppercase letter")

  Escenario: Fallo de registro por conflicto de entidad (email duplicado)
    Dado que el email "existente@usuario.com" ya está registrado
    Cuando realizo una petición POST a "/api/v1/auth/register" usando ese mismo email
    Entonces la API responde con el código de estado HTTP 409 (Conflict)
    Y la respuesta contiene el campo "error" con el mensaje "email is already in use"

  ══════════════════════════════════════════════ BLOQUE 2 — INICIO DE SESIÓN (POST /login) ══════════════════════════════════════════════

  Escenario: Inicio de sesión exitoso devuelve el token de sesión de 7 días
    Cuando realizo una petición POST a "/api/v1/auth/login" con credenciales correctas:
      """
      {
        "email": "valido@usuario.com",
        "password": "Password123!"
      }
      """
    Entonces la API responde con el código de estado HTTP 200 (OK)
    Y la respuesta incluye el campo "token" que contiene un JWT válido
    Y el cliente asume la responsabilidad de almacenar este token de forma segura

  Escenario: Rechazo genérico por credenciales incorrectas
    Cuando realizo una petición POST a "/api/v1/auth/login" con un email no registrado o contraseña incorrecta
    Entonces la API responde con el código de estado HTTP 401 (Unauthorized)
    Y la respuesta contiene el campo "error" con el mensaje genérico "invalid credentials"

  ══════════════════════════════════════════════ BLOQUE 3 — CIERRE DE SESIÓN (POST /logout) ══════════════════════════════════════════════

  Escenario: Cierre de sesión exitoso añade el token a la Blacklist
    Dado que poseo un token de sesión válido
    Cuando realizo una petición POST a "/api/v1/auth/logout"
    Y incluyo la cabecera "Authorization: Bearer <mi_token>"
    Entonces el sistema registra el identificador (JTI) del token en la Blacklist
    Y la API responde con el código de estado HTTP 200 (OK)
    Y la respuesta contiene el campo "message" con el mensaje "Logged out successfully"

  Escenario: Rechazo de cierre de sesión por ausencia de token
    Cuando realizo una petición POST a "/api/v1/auth/logout" sin enviar la cabecera "Authorization"
    Entonces la API responde con el código de estado HTTP 401 (Unauthorized)
    Y la respuesta contiene el campo "error" con el mensaje "Unauthorized: missing token"
