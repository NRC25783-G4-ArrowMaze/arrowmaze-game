# language: es
Característica: FORGE — Editor Visual de Niveles

Como creador de niveles
Quiero un editor visual interactivo (FORGE)
Para diseñar niveles construyendo tableros, conexiones y flechas directamente en la UI

# CONCEPTOS CLAVE
# Celda: nodo identificado por "col,row"; Puerto: 4 puntos (N=0, E=1, S=2, O=3)
# Conexión: enlace puerto-a-puerto (sin restricción de adyacencia)
# Flecha: {head: {cellId, exitPort}, body: [cellIds]} — ocupa |body|+1 celdas
# Escena: JSON plano {cells, connections, arrows, metadata}
# Validación: reglas estructurales + dominio (sin solver)

# DECISIONES DE DISEÑO (D1-D12 en sesión SDD 2026-07-07)
# D1: Arquitectura limpia — sceneOps puras, zustand store con historial
# D2: ID de celda = "col,row" (string codificado)
# D3: Conexiones: un puerto = una conexión (regla A1/BLOQUE 3); auto-conexión prohibida
# D4: Body excluye cabeza (flecha con cabeza en A y body=[B,C] ocupa 3 celdas)
# D5: exitPort se deriva de primer segmento; Rotar solo sin cuerpo
# D6: Colores por índice paleta (8 colores); no viajan en DTO
# D7: Validación reusa LevelLoader (sin duplicar reglas)
# D8: Lienzo fijo (gridCols×gridRows), editable en propiedades
# D9: Undo/Redo con snapshots de Scene
# D10: Playtest embebido (normaliza escena, no persiste)
# D11: Publicación dual (login ADMIN + export JSON)
# D12: Sin solver v1; deuda: DELETE, validación en seco, collisionBehavior

Bloque: LIENZO Y CELDAS

  Escenario: Crear nivel vacío
    Dado una sesión nueva del FORGE
    Cuando veo la pantalla
    Entonces el lienzo muestra grid 8×8 vacío
    Y el panel de validación muestra "✗ Errores: sin celdas, sin flechas"

  Escenario: Colocar celda
    Dado modo "Cell" activo
    Cuando hago clic en un slot gris vacío
    Entonces aparece una celda cuadrada etiquetada "col,row"
    Y el contador de celdas sube

  Escenario: Eliminar celda
    Dado un tablero con celdas conectadas y una flecha atravesando
    Cuando elimino una celda
    Entonces sus conexiones se borran y flechas se truncan

Bloque: CONEXIONES PUERTO-A-PUERTO

  Escenario: Conectar dos puertos
    Dado modo "Connect" activo
    Cuando hago clic en puerto S de celda A
    Y luego en puerto E de celda B (cualquier distancia)
    Entonces aparece línea azul conectando ambos puertos
    Y ambos quedan ocupados (no se pueden conectar a otro)

  Escenario: Desconectar
    Dado un puerto conectado (punto azul)
    Cuando hago clic sin pendiente
    Entonces la conexión se elimina

Bloque: FLECHAS — CONSTRUCCIÓN

  Escenario: Colocar cabeza
    Dado modo "Arrow Head" y una celda libre
    Cuando hago clic
    Entonces aparece disco de color con aro blanco + tick de exitPort
    Y queda auto-seleccionada (halo rojo)

  Escenario: Rotar cabeza antes de extender
    Dado flecha sin cuerpo, seleccionada
    Cuando presiono R
    Entonces tick rota: N → E → S → O → N
    Y SOLO funciona sin cuerpo

  Escenario: Extender a celda conectada
    Dado flecha con exitPort=S, sin cuerpo, modo "Extend"
    Cuando hago clic en candidata conectada
    Entonces se agrega al body
    Y exitPort se ajusta automáticamente al puerto que conecta head→body[0]
    Y cabeza queda fija, solo crece el cuerpo

  Escenario: Candidatas resaltadas
    Dado modo "Extend" con flecha seleccionada
    Entonces se resaltan en amarillo todos los puertos conectados a la última celda
    Y celdas ocupadas no son candidatas

Bloque: FLECHAS — GESTIÓN

  Escenario: Seleccionar flecha
    Dado modo "Select"
    Cuando hago clic en una celda ocupada
    Entonces toda la flecha se resalta en rojo

  Escenario: Eliminar flecha
    Dado modo "Erase"
    Cuando hago clic en una celda de flecha
    Entonces la flecha desaparece

Bloque: VALIDACIÓN

  Escenario: Errores bloquean publicación/playtest
    Dado un nivel sin celdas O sin flechas O ID inválido
    Entonces panel muestra ✗ en rojo (errores)
    Y botón "Probar" está gris (deshabilitado)
    Y no se puede publicar

  Escenario: Warnings informativos
    Dado un nivel válido pero con celda aislada
    Entonces panel muestra ⚠ en amarillo (warning)
    Y "Probar" sigue verde (no bloquea)

Bloque: PROPIEDADES

  Escenario: Editar propiedades del nivel
    Dado panel de propiedades en columna derecha
    Cuando cambio ID, Nombre, Dificultad, Movimientos, Lienzo
    Entonces cada cambio se aplica inmediatamente
    Y undo/redo lo captura

  Escenario: Reducir lienzo valida límites
    Dado celda en (3,5)
    Cuando intento reducir filas a 4
    Entonces alert: "Dejaría celdas fuera (máx row: 5)"

Bloque: UNDO/REDO

  Escenario: Undo revierte
    Dado 3 celdas colocadas
    Cuando presiono Ctrl+Z dos veces
    Entonces se revierten las dos últimas
    Y contador muestra (1)

  Escenario: Redo restaura
    Dado historial con operaciones deshechhas
    Cuando presiono Ctrl+Shift+Z
    Entonces restaura operación siguiente

Bloque: PLAYTEST

  Escenario: Botón activo solo si válido
    Dado nivel sin errores
    Entonces "▶ Probar nivel" es verde
    Dado nivel con errores
    Entonces "▶ Probar nivel" es gris

  Escenario: Probar sin afectar edición
    Dado nivel en edición
    Cuando abro playtest
    Entonces modal muestra escena normalizada
    Y "Volver al editor" cierra modal sin cambios

  Escenario: Reiniciar playtest
    Cuando hago clic "Reiniciar"
    Entonces se recarga (incrementa nonce) y contador = 0

Bloque: PUBLICACIÓN Y EXPORT

  Escenario: Login ADMIN
    Dado form email/password visible
    Cuando ingreso credenciales válidas (rol ADMIN)
    Y hago clic "Entrar"
    Entonces token se guarda en sesión (memoria, no localStorage)
    Y panel muestra 4 botones verdes

  Escenario: Publicar nivel nuevo
    Dado nivel válido, autenticado
    Cuando hago clic "Publicar"
    Entonces POST /api/v1/levels con toLevelDataDTO
    Y si 201: alert "✓ Publicado"
    Y si 409 (existe): pregunta "¿Sobrescribir?" → PUT

  Escenario: Cargar nivel
    Dado autenticado
    Cuando "Cargar nivel..." → prompt ID
    Entonces GET /api/v1/levels/:id
    Y escena se carga (limpia historial, no es undo)

  Escenario: Exportar JSON
    Cuando "Exportar JSON"
    Entonces descarga <id>.json con toLevelDataDTO

  Escenario: Copiar para seed
    Cuando "Copiar para seed"
    Entonces JSON al portapapeles
    Y alert: "✓ Listo para pegar en seeds/levels.seed.json"

Bloque: ATAJOS DE TECLADO

  Escenario: Atajos globales
    Entonces funciona:
      - Ctrl+Z: undo (muestra count)
      - Ctrl+Shift+Z: redo (muestra count)
      - R: rotar cabeza seleccionada
      - Escape: deseleccionar + cancelar conexión pendiente
