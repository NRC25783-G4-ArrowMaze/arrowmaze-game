# AI Usage — Arrow Maze Client: Reporte Integral y Dinámica de Desarrollo

Este documento ofrece un análisis profundo y exhaustivo sobre la integración de Inteligencia Artificial en el ciclo de desarrollo del cliente web y móvil nativo de **Arrow Maze**. A diferencia de un simple registro de comandos o *prompts*, este archivo sirve como un manifiesto técnico y metodológico sobre cómo estructurar un equipo híbrido (humanos y múltiples agentes de IA) para construir software escalable usando principios de **Clean Architecture** y **Domain-Driven Design (DDD)**.

El repositorio auditable que respalda este documento (con un reporte detallado por cada sesión, los *prompts* utilizados, problemas y lecciones aprendidas) se encuentra en la carpeta [`.ai-usage/`](./.ai-usage/README.md). En su interior, el archivo `manifest.json` contiene el índice computacional de más de 65 sesiones registradas a lo largo de las distintas fases de vida de este cliente.

---

## 🚀 1. Metodología: Spec-Driven Development (SDD) Aumentado

En *Arrow Maze*, hemos adoptado una filosofía rígida para interactuar con la IA: **Ninguna línea de código se escribe sin un "spec" aprobado y un plan arquitectónico validado.**

Esta decisión nació tras observar que permitir a agentes de IA codificar grandes volúmenes de features de manera autónoma sin una supervisión humana y documental intermedia generaba un severo acoplamiento de código y la pérdida gradual de la Clean Architecture.

Para solucionar esto, dividimos funcionalmente los roles de la Inteligencia Artificial simulando la asimetría de un equipo senior-junior:

### 1.1. El Arquitecto y Planificador (Antigravity / Modelos de Razonamiento)
El primer paso ante cualquier feature recae sobre modelos de alto razonamiento cognitivo (como *Claude 3.5 Sonnet* o variantes de razonamiento). En este rol, la IA:
- Recibe un *feature spec* en lenguaje natural.
- **Lee el código existente:** Entidades, Use Cases y pruebas impactadas.
- **Identifica ambigüedades:** Realiza preguntas obligatorias sobre comportamiento, casos aislados (edge-cases) e impacto topológico.
- **Genera un Plan de Handoff (doc/*_plan.md):** Especifica las dependencias necesarias, crea los criterios Gherkin, lista los archivos que se deben crear y, crucialmente, lista los archivos que **no se deben tocar** bajo ninguna circunstancia.
- **NO programa.** Se limita estrictamente a pensar, documentar y generar consenso con el supervisor humano.

### 1.2. El Ejecutor TDD (Claude Code — Modelos de Implementación)
Una vez que el plan es sellado y aprobado, modelos más veloces y de ejecución precisa (como *Claude Haiku*) toman el relevo. 
- La directiva principal para este agente es **TDD Estricto**. 
- Recibe el plan arquitectónico, implementa la prueba unitaria primero (verifica el fallo / estado rojo), luego escribe el código mínimo para pasar la prueba y finalmente refactoriza.
- Si el plan carece de especificidad o el modelo debe asumir algo que no estaba en el documento original, **se detiene, aborta el handoff y alerta al humano**. No improvisa; sigue el mapa.

Esta separación ha garantizado que el diseño de *Arrow Maze* mantenga un 100% de aislamiento en su Capa de Dominio (pura lógica matemática y topológica de listas enlazadas, libre de frameworks) mientras la velocidad de escritura de código de aplicación e infraestructura sigue siendo inmensa.

---

## 🛠️ 2. Fases del Proyecto: Un Historial de Colaboración

La carpeta `.ai-usage/` relata un viaje desde un repositorio vacío hasta un sistema de puzzle con un motor enlazado en tiempo real, persistencia local-first y entornos tridimensionales. Estas han sido las aportaciones más representativas:

### Fase 1: Scaffold y Setup de Clean Architecture (Principios de Junio 2026)
Durante las primeras sesiones (registros `2026-06-01-*`), la IA fue responsable de preparar el terreno.
- **Reto:** Configurar Vite, React, TypeScript y Capacitor garantizando que las capas de Dominio (`src/domain`), Aplicación (`src/application`) e Infraestructura (`src/infrastructure`) no se contaminaran mutuamente.
- **Aportación de IA:** Generó el `tsconfig.json` con `strict: true` y reglas *barrel* para modularización. Construyó las primeras abstracciones base, definiendo clases de errores (`DomainError`) y tipos de Resultados Tipados en lugar de excepciones nativas genéricas.

### Fase 2: Motor de Movimiento y Reglas de Negocio (Mediados de Junio 2026)
La esencia de *Arrow Maze* (el "feature A3") es compleja: flechas que actúan como listas doblemente enlazadas moviéndose autónomamente sobre un grafo no direccional.
- **Tail-Collision Detection:** Un modelo *Opus* fue capaz de modelar el escenario donde la "cabeza" de una flecha intentaba entrar en un puerto que su propia "cola" iba a abandonar en ese mismo tick. A través de diagramas y tests iterativos, la IA logró definir un algoritmo de resolución multi-fase (*Collect, Project, Validate, Commit*).
- **Animaciones Tick-a-Tick:** Modelos como *Fable* y *Sonnet* permitieron convertir estos ticks matemáticos del dominio en visuales fluidas, agregando efectos como `glide` inter-celdas y rebotes (`recoil`) cuando las flechas chocan o entran en callejones sin salida.

### Fase 3: Persistencia "Offline-First" y Session Management (Finales de Junio 2026)
Dado el empaquetado para iOS/Android con Capacitor, el juego requería persistir partidas sin conexión a internet, pero sincronizarse cuando se restauraba la red.
- **Aportación de IA:** Diseñó un `LocalProgressModuleFactory` empleando el patrón Factory y el patrón Adapter.
- Logró orquestar un driver SQLite (`CapacitorSqliteDriver`) encriptando el estado en un Repositorio SQL, mientras exponía a la Capa de Aplicación simplemente la interfaz `ILocalProgressRepository`. Luego un scheduler *single-flight* coordina el push al backend usando validación optimista de fechas (`isBeatenBy`).

### Fase 4: Experiencia Integral de Producto (Inicios de Julio 2026)
Con la mecánica estabilizada, el foco pasó a los componentes de calidad visual y usabilidad.
- **Modo Oscuro Dinámico:** Generación de un sistema de variables de CSS puro administrado por un Contexto global.
- **Audio Dinámico (SFX/BGM):** Con integraciones puntuales que detectan el evento emitido por el motor (`advanced`, `blocked`, `destroyed`) y disparan distintos sonidos en Capacitor según el resultado y la dificultad.
- **Internacionalización:** Generación de diccionarios e implementación de traducciones *Hot-Swappable* para Inglés y Español.

### Fase 5: El Salto Tecnológico — 3D, Forge y Modo Cubo (Mediados de Julio 2026)
Los registros más densos (`2026-07-13-*`) marcan la migración de un tablero 2D SVG tradicional a vistas 3D isométricas completas.
- **El Modo Cubo (Cube Level):** La IA modeló un desafío topológico enorme donde el tablero de juego (un grafo plano) se adaptó para estar renderizado en las caras de un cubo 3D transparente (3x3x3).
- **3D Glide Engine:** Para que la cámara persiguiera la flecha y rotara adecuadamente las caras del cubo durante la travesía de las listas enlazadas, los modelos matemáticos de Claude generaron cálculos de Euler complejos para rotaciones interpoladas (`lerp`) sin inducir *gimbal lock*. El resultado es una experiencia bautizada como la "Singularidad".

---

## 🛡️ 3. El Valor de la Auditoría: Alucinaciones y Desvíos Mitigados

Parte fundamental de nuestro reporte es documentar sistemáticamente **dónde, cómo y por qué falla la IA**. El flujo estricto `Spec -> Humano -> IA Code -> Humano` no es una burocracia arbitraria; es la red de seguridad del repositorio. Las inteligencias artificiales, al estar entrenadas en bases de datos masivas y heterogéneas, tienden naturalmente a dos fallos estructurales en repositorios privados:
1. **El Sesgo hacia lo Popular:** Ante la duda, los LLMs elegirán el camino más documentado en internet (ej. usar `any`, usar excepciones planas, importar directamente herramientas no permitidas) ignorando las restricciones impuestas por la Arquitectura Limpia del proyecto.
2. **La Degradación del Contexto:** En refactorizaciones largas, los modelos de implementación pierden el mapa mental del grafo de dependencias, eliminando o inyectando lógica en capas incorrectas.

A lo largo del proyecto, la IA ha cometido errores y alucinaciones críticas que habrían roto irreparablemente el desarrollo sin este proceso de auditoría y mitigación:

| Caso Detectado y Documentado | Por qué falló la IA | Corrección Humano/IA |
|-----------------------------------|-----------------------|------------------------|
| **Contaminación Node.js en Vite** | Al pedir acceso a variables de entorno, la IA recurrió automáticamente a su hábito más arraigado: `process.env`. Esto obligó a descargar `@types/node` e inyectó código *backend-only* en un framework puramente frontend. | La compilación TypeScript (en modo estricto) falló instantáneamente. El humano intervino, forzó el uso del objeto estándar `import.meta.env` del ecosistema Vite y reforzó permanentemente las reglas de *prompting* para recordarle el entorno. |
| **Generación UML Rota (PlantUML)** | Al intentar autogenerar documentación UML a través de la herramienta CLI `tplant`, el modelo intentó predecir y auto-completar el diagrama en lugar de parsear puramente el AST, resultando en sintaxis inválida (clases flotantes sueltas, relaciones bidireccionales falsas). | El equipo humano tuvo que analizar el fallo de renderizado, y finalmente escribió un script de posprocesamiento (`postprocess-uml.js`) guiado pero auditado paso a paso para sanear la sintaxis programáticamente. |
| **Eliminación Accidental de Código** | Durante un refactor complejo (registro de limpieza `2026-06-02`), el agente implementador sufrió "degradación de contexto". Asumió que "reemplazar lógicas" significaba eliminar y sobrescribir componentes enteros en lugar de inyectar dependencias actualizadas. | La revisión humana estricta en el Pull Request interceptó masivos *deleted files* en la Capa de Aplicación. El merge fue abortado y la tarea regresó a la fase de especificación (Planning Mode) dividida en dos pasos más pequeños. |
| **Lógica Asíncrona de Promesas (Race Conditions)** | Al diseñar el motor de sincronización SQLite/Remoto *local-first*, la IA fue incapaz de prever *race conditions* de red. Olvidó crear semáforos, dejando vulnerable el juego a un doble-guardado cuando el usuario golpeaba el botón de *retry* repetidamente. | Se expuso el fallo mediante un playtest agresivo. Luego, se obligó a la IA mediante *prompting* específico a rehacer la solución integrando un modelo de control de asincronismo y puertas *single-flight*. |
| **Pérdida de Progreso en Navegación (Router)** | Al avanzar de nivel de forma exitosa, la IA programó el enrutamiento (`react-router`) de forma que el estado en memoria se desmontaba antes de enviar el push al servidor de progreso, lo que causaba la pérdida de la partida registrada. | A través del depurador del navegador, el humano aisló el error del ciclo de vida del componente. Se le instruyó a la IA separar la persistencia asíncrona del desmontaje visual del UI. |

**Lección Principal de este Proyecto:** 
La asimetría de la IA es incuestionable. Acelera el tipeo, el modelado matemático (*boilerplate*) y las iteraciones de un 100% a un 400%. Sin embargo, **carece de sentido crítico arquitectónico a largo plazo**. La revisión integral, basada en tests estables (`Jest`), *linters* inflexibles (`TypeScript strict`) y el imprescindible *playtest* empírico, es y seguirá siendo netamente responsabilidad humana. La IA propone, el humano dispone.
---

## 📊 4. Estadísticas del Trabajo Híbrido

A partir del manifiesto (`manifest.json`) recopilamos las siguientes métricas del estado actual del repositorio *Arrow Maze*:

*   **Total de Sesiones Auditadas Registradas:** 65+ (desde el `2026-06-01` al `2026-07-13`).
*   **Volumen de Tests Autogenerados/Redactados:** 559 a 561 tests en más de 20+ suites; ejecutándose con 0 fallos.
*   **Proporción Asistida Estimada:** Se estima que un asombroso ~80% de las líneas totales de este repositorio han pasado directa o indirectamente por el teclado de una IA, actuando el humano como un "editor de alto nivel" y "tester de producto final".
*   **Herramientas Consensuadas:** Claude CLI / Haiku (para implementación rutinaria), Sonnet/Opus y Antigravity (para specs, modelado matemático y 3D) y Gemini (para documentación y queries de compilación).

---

## 📝 5. Directrices para el Futuro y Reglas del Contribuidor

El documento de directrices `CLAUDE.md` de este proyecto y las reglas en `.cursor/rules` son la "Constitución" bajo la cual nuestros agentes de IA operan. Si estás contribuyendo (o eres una instancia IA que fue llamada a contribuir), debes atenerte al siguiente manifiesto de operaciones:

1. **Inmutabilidad de la Capa de Dominio:** Los directorios dentro de `domain` y sus entidades jamás pueden importar nada fuera de sí mismos. Si una IA sugiere requerir `import React` o `import sqlite` dentro de esta zona, debes abortar la sesión inmediatamente.
2. **Generación del Reporte:** Terminado un feature, es imperativo generar un registro `YYYY-MM-DD-titulo.md` que detalle la herramienta, la justificación y los archivos alterados, e inyectarlo en `.ai-usage/README.md`.
3. **Commit Manual y Convencional:** La IA se limita a sugerir el mensaje de commit semántico (`feat(domain): ...`). El humano es el que escribe físicamente en la consola `git commit` y empuja a `origin`.

La inteligencia artificial nos permitió construir el esqueleto, la topología matemática y los gráficos poligonales del **Arrow Maze** en fracciones de los ciclos estándar en la industria. No obstante, nuestro marco SDD asegura que **los agentes de silicio siguen escribiendo el software que la mente humana imaginó.**
