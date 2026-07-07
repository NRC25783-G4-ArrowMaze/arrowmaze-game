---
name: ai-usage-reporter
description: >
  Genera reportes de uso de IA (AI Usage Report) estructurados en formato Markdown estándar
  auditable. Úsalo SIEMPRE que el usuario mencione "ai-usage", "reporte de IA", "registro de
  uso de IA", "documentar uso de Claude/GPT/Copilot", "AI usage report", "generar reporte de
  herramienta IA", o cuando quiera registrar qué herramientas de IA usó, cómo las usó, qué
  generaron, y qué modificaciones hicieron los humanos. Funciona con entrada manual (datos
  directos) o conversaciones completas pegadas en el chat.
applyTo:
  - Any request mentioning AI tool usage reporting or documentation
  - Requests to summarize or audit AI-assisted sessions
  - Documentation of prompt engineering workflows
---
 
# AI Usage Reporter
 
Genera entradas de reporte de uso de IA en formato estándar auditable, con preferencia por llamar
a modelos Haiku cuando procese conversaciones extensas.
 
---
 
## Formato de Salida
 
Cada entrada del reporte sigue EXACTAMENTE esta estructura:
 
```markdown
### YYYY-MM-DD — <Resumen de la tarea en una línea>
 
- **Herramienta:** <Cursor / Claude / GPT / Copilot / Gemini / otra>
- **Modelo / versión:** <claude-haiku-4-5 / gpt-4o / gemini-1.5-flash / si se desconoce: "No especificado">
- **Autor humano responsable:** <nombre, handle o equipo>
- **Prompt(s) representativo(s):**
  - "..."
  - "..." *(solo si hay más de uno relevante)*
- **Salida tomada de la IA:** <descripción de archivos, funciones, bloques principales generados>
- **Modificaciones manuales del equipo:** <qué se ajustó manualmente y por qué; si ninguna: "Ninguna">
- **Validación realizada:** <tests ejecutados, lint, revisión de código, revisión humana, etc.>
```
 
**Reglas del formato:**
- La fecha usa `YYYY-MM-DD` (ISO 8601). Si no se especifica, usar la fecha de hoy.
- El resumen de la tarea es una frase corta y descriptiva (máx. 10 palabras).
- Los prompts representativos son los que mejor capturan la intención del usuario.
- Si la entrada proviene de una conversación completa, agregar al final un bloque de resumen (ver sección "Modo Conversación").
---
 
## Flujo de Trabajo (Paso a Paso)
 
### PASO 1 — Identificar el modo de entrada
 
| Tipo de entrada | Descripción |
|---|---|
| **Manual** | El usuario provee los datos directamente (fecha, herramienta, prompts, etc.) |
| **Conversación** | El usuario pega o comparte una conversación completa para analizar |
| **Mixto** | Datos parciales + fragmentos de conversación |
 
### PASO 2 — Extraer los datos necesarios
 
**Para entrada manual**, preguntar solo lo que falte:
- Fecha (default: hoy)
- Herramienta y modelo usados
- Autor responsable
- Tarea realizada
- Prompts usados
- Qué salida se tomó
- Modificaciones manuales
- Validación realizada
**Para conversaciones**, extraer automáticamente:
- Los mensajes del usuario → prompts representativos
- Los mensajes del asistente → salida tomada
- Indicadores de edición manual ("lo cambié a...", "ajusté...", "modifiqué...")
- Indicadores de validación ("lo probé", "pasó los tests", "revisé manualmente")
### PASO 3 — Llamar a Haiku si la conversación es larga
 
Si el input es una conversación con más de ~20 turnos o ~3000 palabras, usar la API de Claude
con modelo Haiku para extraer los campos estructurados antes de formatear.
 
Ver sección **"Uso de Haiku para Conversaciones"** más abajo.
 
### PASO 4 — Generar la entrada del reporte
 
Con todos los datos extraídos, formatear según el template exacto.
 
### PASO 5 — Si es conversación, agregar resumen al final
 
Cuando el input sea una conversación completa, agregar después de la entrada estándar:
 
```markdown
---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** <N turnos / N minutos estimados>
- **Contexto de la conversación:** <qué se estaba construyendo o resolviendo>
- **Decisiones clave tomadas:** <las 2-3 decisiones más importantes del humano>
- **Patrones de uso observados:** <cómo usó la IA el humano: iterativo, directivo, explorador, etc.>
```
 
---
 
## Uso de Haiku para Conversaciones
 
Cuando el input sea una conversación larga (>20 turnos o >3000 palabras), delegar la extracción
estructurada a `claude-haiku-4-5-20251001` via API. Esto reduce tokens y es más eficiente.
 
### Implementación
 
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: `Eres un extractor de metadatos de conversaciones de IA. 
Dado el texto de una conversación entre un humano y un asistente IA, 
responde SOLO con un objeto JSON válido con estos campos exactos:
{
  "fecha": "YYYY-MM-DD o null",
  "herramienta": "nombre de la herramienta IA",
  "modelo": "modelo/versión o 'No especificado'",
  "autor": "nombre o handle del humano si se menciona, o 'No especificado'",
  "resumen_tarea": "frase corta de máx 10 palabras describiendo qué se hizo",
  "prompts_representativos": ["prompt 1", "prompt 2"],
  "salida_tomada": "descripción de qué generó la IA que se usó",
  "modificaciones_manuales": "qué ajustó el humano o 'Ninguna'",
  "validacion": "cómo se validó el resultado o 'No especificada'",
  "duracion_turnos": número_de_turnos,
  "decisiones_clave": ["decisión 1", "decisión 2"],
  "patron_uso": "iterativo | directivo | explorador | mixto"
}
No incluyas explicaciones ni texto fuera del JSON.`,
    messages: [{ role: "user", content: conversationText }]
  })
});
 
const data = await response.json();
const extracted = JSON.parse(data.content[0].text);
```
 
### Cuándo usar Haiku vs. procesar directamente
 
| Condición | Acción |
|---|---|
| Conversación < 20 turnos | Extraer directamente sin llamada API |
| Conversación ≥ 20 turnos | Llamar a Haiku para extracción |
| Input es solo datos sueltos | No llamar API, formatear directo |
| Usuario pide explícitamente haiku | Siempre usar Haiku |
 
---
 
## Ejemplos de Salida
 
### Ejemplo 1 — Entrada Manual Simple
 
```markdown
### 2025-07-14 — Generación de componente React para tabla de datos
 
- **Herramienta:** Claude
- **Modelo / versión:** claude-sonnet-4-6
- **Autor humano responsable:** @dev-maria
- **Prompt(s) representativo(s):**
  - "Crea un componente React con TypeScript para mostrar una tabla paginada con sorting"
  - "Agrega un filtro de búsqueda por columna"
- **Salida tomada de la IA:** `DataTable.tsx` completo con hooks de sorting/paginación, tipos TypeScript
- **Modificaciones manuales del equipo:** Se ajustó el tamaño de página default de 10 a 25 filas; se renombró la prop `data` a `rows` para consistencia con el resto del codebase
- **Validación realizada:** Tests unitarios con Vitest (4/4 pasando); revisión manual del equipo frontend
```
 
### Ejemplo 2 — Desde Conversación (con resumen al final)
 
```markdown
### 2025-07-15 — Refactorización de módulo de autenticación a JWT
 
- **Herramienta:** Cursor
- **Modelo / versión:** claude-haiku-4-5
- **Autor humano responsable:** @backend-team / carlos
- **Prompt(s) representativo(s):**
  - "Refactoriza este middleware de sesiones para usar JWT en vez de cookies"
  - "¿Cómo manejo el refresh token de forma segura?"
- **Salida tomada de la IA:** `auth.middleware.ts` refactorizado, helper `generateToken()`, `validateToken()`
- **Modificaciones manuales del equipo:** Se movió el secret key a variables de entorno (la IA lo hardcodeó en el ejemplo); se ajustó tiempo de expiración a 1h según política de seguridad interna
- **Validación realizada:** Tests de integración con Supertest, revisión de seguridad por el tech lead
 
---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** 18 turnos / ~25 minutos
- **Contexto de la conversación:** Migración del sistema de auth de sesiones a JWT stateless
- **Decisiones clave tomadas:** Separar access token (1h) de refresh token (7d); no almacenar en localStorage
- **Patrones de uso observados:** Iterativo — el humano fue refinando con preguntas de seguridad específicas
```
 
---
 
## Checklist de Validación Antes de Entregar
 
Antes de presentar el reporte generado, verificar:
 
- [ ] Fecha en formato `YYYY-MM-DD`
- [ ] Resumen de tarea en ≤ 10 palabras
- [ ] Herramienta y modelo especificados (o "No especificado" si se desconoce)
- [ ] Al menos 1 prompt representativo
- [ ] Salida descrita con nombres de archivos/funciones concretos cuando aplique
- [ ] Modificaciones manuales: específicas o "Ninguna" — nunca dejar vacío
- [ ] Validación descrita o "No especificada" — nunca dejar vacío
- [ ] Si era conversación: bloque de resumen agregado al final
---
 
## Errores Comunes a Evitar

- ❌ Inventar prompts o salidas que no fueron mencionados
- ❌ Dejar campos en blanco — siempre poner "No especificado" o "Ninguna"
- ❌ Usar fecha relativa ("hoy", "ayer") — siempre `YYYY-MM-DD`
- ❌ Resúmenes de tarea demasiado genéricos ("se usó IA")
- ❌ Omitir el bloque de resumen cuando el input era una conversación completa
- ❌ Confundir "salida tomada" con "todo lo que generó la IA" — solo lo que el equipo adoptó
 