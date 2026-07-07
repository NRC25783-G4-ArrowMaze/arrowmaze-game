Feature: API REST de Distribución y Actualización Remota de Niveles

  Como aplicación cliente (motor del juego) y administrador del sistema
  Quiero consultar y gestionar las definiciones de los niveles (LevelData) mediante una API
  Para obtener el contenido del juego dinámicamente y permitir actualizaciones sin lanzar nuevas versiones de la app móvil

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  # LevelMetadata : Resumen del nivel (id, name, difficulty, allowedMoves) usado para listar en el menú.
  # LevelData     : DTO completo que incluye la topología (cells, connections, arrows).
  # Admin         : Rol de usuario con permisos para crear o sobrescribir niveles.
  # ─────────────────────────────────────────────

  Background: configuración base de la API de niveles
    Given que la API acepta y responde estrictamente con "application/json"
    And las rutas operan bajo el prefijo "/api/v1/levels"

  # ══════════════════════════════════════════════
  # BLOQUE 1 — CATÁLOGO DE NIVELES (CLIENTE)
  # ══════════════════════════════════════════════

  Scenario: consultar el listado general de niveles disponibles
    When realizo una petición GET a "/api/v1/levels"
    Then la API responde con código HTTP 200 (OK)
    And el cuerpo de la respuesta es un array de objetos `LevelMetadata`
    And los objetos incluyen "id", "name", "difficulty" y "allowedMoves"
    And los objetos EXCLUYEN estrictamente "cells", "connections" y "arrows" para ahorrar ancho de banda

  Scenario: filtrar niveles por dificultad
    When realizo una petición GET a "/api/v1/levels?difficulty=hard"
    Then la API responde con código HTTP 200 (OK)
    And el array de respuesta contiene únicamente niveles cuya propiedad "difficulty" es "hard"

  # ══════════════════════════════════════════════
  # BLOQUE 2 — DESCARGA DE UN NIVEL ESPECÍFICO (CLIENTE)
  # ══════════════════════════════════════════════

  Scenario: descarga exitosa de la definición completa de un nivel
    Given que existe un nivel con ID "level_01" en la base de datos
    When realizo una petición GET a "/api/v1/levels/level_01"
    Then la API responde con código HTTP 200 (OK)
    And el cuerpo de la respuesta es un objeto `LevelData` completo con "cells", "connections" y "arrows"
    And la estructura coincide exactamente con el contrato esperado por el motor del juego

  Scenario: intento de descarga de un nivel inexistente
    When realizo una petición GET a "/api/v1/levels/ghost_level"
    Then la API responde con código HTTP 404 (Not Found)
    And la respuesta contiene el campo "error" con el mensaje "Level not found"

  # ══════════════════════════════════════════════
  # BLOQUE 3 — SINCRONIZACIÓN MASIVA (CLIENTE)
  # ══════════════════════════════════════════════

  Scenario: descarga masiva de todas las definiciones de niveles
    When realizo una petición GET a "/api/v1/levels/bulk"
    Then la API responde con código HTTP 200 (OK)
    And el cuerpo de la respuesta es un array que contiene todos los objetos `LevelData` completos
    And el cliente puede utilizar esta respuesta para actualizar su caché local de una sola vez

  # ══════════════════════════════════════════════
  # BLOQUE 4 — PUBLICACIÓN Y ACTUALIZACIÓN (ADMIN)
  # ══════════════════════════════════════════════

  Scenario: creación exitosa de un nuevo nivel por un administrador
    Given un usuario autenticado con el rol "ADMIN"
    When realizo una petición POST a "/api/v1/levels" con un payload JSON `LevelData` válido
    Then el backend valida la estructura del payload
    And el nivel se guarda en la base de datos
    And la API responde con código HTTP 201 (Created)
    And la respuesta incluye el campo "message" con el valor "Level created successfully"

  Scenario: actualización de un nivel existente
    Given un usuario autenticado con el rol "ADMIN"
    And que existe un nivel con ID "level_01"
    When realizo una petición PUT a "/api/v1/levels/level_01" con un payload `LevelData` válido actualizado
    Then el backend sobrescribe la definición del nivel en la base de datos
    And la API responde con código HTTP 200 (OK)
    And la respuesta incluye el campo "message" con el valor "Level updated successfully"

  Scenario: rechazo de publicación por usuario no autorizado
    Given un usuario autenticado sin el rol "ADMIN" (rol "USER") o no autenticado
    When intento realizar una petición POST a "/api/v1/levels"
    Then el middleware de seguridad intercepta la petición
    And la API responde con código HTTP 403 (Forbidden)
    And la respuesta contiene el campo "error" con el mensaje "Forbidden: insufficient permissions"
    And la base de datos no sufre modificaciones

  # ══════════════════════════════════════════════
  # BLOQUE 5 — VALIDACIÓN DE INTEGRIDAD DEL PAYLOAD (POST/PUT)
  # ══════════════════════════════════════════════

  Scenario: rechazo de publicación por falta de campos requeridos
    Given un usuario "ADMIN"
    When realizo una petición POST a "/api/v1/levels" con un payload al que le falta "allowedMoves"
    Then la API responde con código HTTP 400 (Bad Request)
    And la respuesta detalla el error: "LevelDataError: missing required field 'allowedMoves'"

  Scenario: rechazo de publicación por enviar un nivel sin flechas
    Given un usuario "ADMIN"
    When realizo una petición POST a "/api/v1/levels" con el array "arrows" vacío
    Then la API responde con código HTTP 400 (Bad Request)
    And la respuesta detalla el error: "LevelDataError: board must contain at least one arrow"
