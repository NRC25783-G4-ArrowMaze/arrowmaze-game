# language: es
Característica: Gestión de Identidad y Autenticación de Usuarios
  Como sistema de seguridad
  Quiero registrar, validar y autenticar credenciales en memoria y base de datos
  Para gestionar el acceso seguro de los usuarios y el ciclo de vida de sus sesiones

  ─────────────────────────────────────────────
  CONCEPTOS CLAVE

  Account : Entidad de usuario con un identificador único y credenciales
  Credential: Par de [email, password_hash] (la contraseña original nunca se almacena)
  Session : Token criptográfico (JWT con JTI) que vincula temporalmente un Account con un cliente

  ─────────────────────────────────────────────

  Antecedentes:
    Dado que el sistema reconoce las siguientes políticas de seguridad:
      | campo | regla |
      | email | formato RFC 5322 válido y único en el sistema |
      | password | mínimo 8 caracteres, 1 número, 1 letra mayúscula |
      | token | JWT con identificador único (JTI) y tiempo de expiración (TTL) de 7 días |

  ══════════════════════════════════════════════ BLOQUE 1 — REGISTRO DE CUENTA ══════════════════════════════════════════════

  Escenario: Creación de una cuenta con credenciales válidas
    Cuando registro una cuenta con el email "usuario@test.com" y password "Secreta123"
    Entonces la cuenta existe en el sistema
    Y su email es "usuario@test.com"

  Escenario: Rechazo de registro por formato de email inválido
    Cuando intento registrar una cuenta con el email "usuario.test.com"
    Entonces el sistema lanza el error "ValidationError: invalid email format"
    Y la cuenta no se crea en el sistema

  Escenario: Rechazo de registro por contraseña débil
    Cuando intento registrar una cuenta con el password "clave"
    Entonces el sistema lanza el error "ValidationError: password must contain at least 8 characters, 1 number, and 1 uppercase letter"

  Escenario: Rechazo de registro por email duplicado
    Dado una cuenta ya existente con el email "admin@test.com"
    Cuando intento registrar una nueva cuenta con el email "admin@test.com"
    Entonces el sistema lanza el error "RegistrationError: email is already in use"

  ══════════════════════════════════════════════ BLOQUE 2 — INICIO Y CIERRE DE SESIÓN ══════════════════════════════════════════════

  Escenario: Inicio de sesión válido genera un token de sesión
    Dado una cuenta "user@test.com"
    Cuando inicio sesión con su contraseña correcta
    Entonces el sistema genera un "Session Token" válido

  Escenario: Rechazo de inicio de sesión de un usuario inexistente
    Cuando intento iniciar sesión con el email "invalid@test.com"
    Entonces el sistema lanza el error "AuthError: invalid credentials"
    # Nota de seguridad: El mensaje de error es el mismo que para contraseña incorrecta
    # para evitar la enumeración de usuarios.

  Escenario: Cierre de sesión explícito revoca el token
    Dado una cuenta con una sesión activa representada por un "Token_A"
    Cuando ejecuto el cierre de sesión proporcionando el "Token_A"
    Entonces el identificador único (JTI) del "Token_A" es añadido a la lista negra
    Y el sistema rechaza cualquier petición futura con este token

  Escenario: Uso de token revocado lanza error de autenticación
    Dado un "Token_A" cuyo JTI se encuentra en la lista negra
    Cuando intento acceder a un recurso protegido usando el "Token_A"
    Entonces el sistema lanza el error "AuthError: session token is invalid or has been revoked"

  ══════════════════════════════════════════════ BLOQUE 3 — INVARIANTES DE SEGURIDAD ══════════════════════════════════════════════

  Escenario: La contraseña original nunca es recuperable desde el almacenamiento
    Dado una cuenta registrada con el password "Secreta123"
    Cuando consulto los datos almacenados de la cuenta en base de datos o memoria
    Entonces account.passwordHash no es igual a "Secreta123"
    Y account.password (texto plano) es undefined

  Escenario: Todo token activo pertenece obligatoriamente a una cuenta existente
    Dado cualquier "Session Token" válido en el sistema
    Entonces token.accountId apunta a un Account que existe en el sistema
