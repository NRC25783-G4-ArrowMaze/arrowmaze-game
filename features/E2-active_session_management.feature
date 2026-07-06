# language: es
Característica: Gestión de Sesión Activa
  Como backend de seguridad
  Quiero gestionar la autenticación mediante un único token JWT de larga duración
  Para simplificar la arquitectura manteniendo al usuario autenticado por varios días

  ─────────────────────────────────────────────
  CONCEPTOS CLAVE

  Session Token : JWT único usado para autorizar peticiones a la API
  Payload : Carga útil del JWT (contiene id del usuario, roles, pero NO datos sensibles)
  Blacklist : Registro en base de datos de tokens revocados explícitamente antes de su expiración

  ─────────────────────────────────────────────

  Antecedentes:
    Dado que el sistema implementa una arquitectura de token único con las siguientes reglas:
      | tipo | TTL (Time To Live) | almacenamiento esperado en cliente |
      | Session Token | 7 días | Almacenamiento seguro / LocalStorage |
    Y el backend mantiene un registro de tokens invalidados ("Blacklist") en la base de datos

  ══════════════════════════════════════════════ BLOQUE 1 — ACCESO A RECURSOS PROTEGIDOS ══════════════════════════════════════════════

  Escenario: Petición autorizada con Session Token válido
    Dado un cliente con un "Session Token" activo, firma válida y no revocado
    Cuando el cliente realiza una petición a una ruta protegida incluyendo el token en la cabecera "Authorization: Bearer"
    Entonces el sistema verifica la firma del JWT
    Y el sistema verifica que el identificador del token (jti) no esté en la "Blacklist"
    Y el sistema procesa la petición correctamente
    Y el sistema extrae el "userId" del payload para identificar al actor

  Escenario: Rechazo de petición por falta de token
    Cuando un cliente realiza una petición a una ruta protegida sin cabecera "Authorization"
    Entonces el sistema lanza el error HTTP 401 "Unauthorized: missing token"
    Y la petición es denegada antes de llegar al controlador

  Escenario: Rechazo de petición por Session Token manipulado (firma inválida)
    Dado un cliente que ha modificado el payload de su "Session Token"
    Cuando el cliente realiza una petición a una ruta protegida
    Entonces el sistema detecta que la firma no coincide con el payload
    Y el sistema lanza el error HTTP 401 "Unauthorized: invalid token signature"

  ══════════════════════════════════════════════ BLOQUE 2 — EXPIRACIÓN DEL TOKEN Y RE-AUTENTICACIÓN ══════════════════════════════════════════════

  Escenario: Rechazo por Session Token expirado después de 7 días
    Dado un "Session Token" cuyo tiempo límite (claim 'exp') ha sido superado
    Cuando el cliente realiza una petición a una ruta protegida con este token
    Entonces el sistema lanza el error HTTP 401 "TokenExpiredError: session has expired"
    Y el cliente es notificado de que debe iniciar sesión nuevamente con sus credenciales

  ══════════════════════════════════════════════ BLOQUE 3 — REVOCACIÓN Y CIERRE DE SESIÓN ══════════════════════════════════════════════

  Escenario: El cierre de sesión añade el token a la lista negra
    Dado un cliente autenticado con un "Session Token" válido
    Cuando el cliente realiza una petición al endpoint de cierre de sesión
    Entonces el sistema extrae el identificador único del token
    Y el sistema guarda este identificador en la "Blacklist" de la base de datos con fecha de expiración igual a la del token
    Y el cliente es desconectado exitosamente

  Escenario: Rechazo de acceso usando un token que fue cerrado/revocado
    Dado un "Session Token" que fue registrado previamente en la "Blacklist" tras un cierre de sesión
    Cuando el cliente (o un atacante) intenta acceder a una ruta protegida usando este token
    Entonces el sistema detecta el identificador en la "Blacklist"
    Y el sistema lanza el error HTTP 403 "Forbidden: token has been revoked"

  ══════════════════════════════════════════════ BLOQUE 4 — INVARIANTES DEL PAYLOAD Y VALIDACIÓN ══════════════════════════════════════════════

  Escenario: El payload del Session Token contiene identificadores únicos
    Dado un "Session Token" generado tras un login exitoso
    Cuando decodifico el payload (Base64Url)
    Entonces el payload contiene el "userId"
    Y el payload contiene el claim "jti" (JWT ID) para permitir su rastreo y revocación
    Y el payload NO contiene la contraseña, ni el hash de la contraseña, ni datos personales sensibles

  Escenario: Limpieza automática de la lista negra
    Dado un registro en la "Blacklist" de un token que expiraba en una fecha determinada pasada
    Cuando el sistema ejecuta su tarea de mantenimiento programada
    Entonces el registro es eliminado de la base de datos permanentemente porque el token ya no es criptográficamente válido
