# Generación y Visualización de Diagramas de Clase con PlantUML

Este proyecto incluye soporte para generar de forma automática diagramas de clase en formato **PlantUML** (`.puml`) a partir del código TypeScript ubicado en la carpeta `src/`.

## Cómo Generar el Diagrama

Para generar el archivo `classes.puml` con el modelo actualizado de las clases e interfaces, ejecuta el siguiente comando en la raíz del proyecto:

```bash
pnpm run gen-uml
```

### ¿Qué hace este comando?
1. Ejecuta `tplant` para escanear y compilar todos los archivos `.ts` bajo `src/` a la sintaxis de diagrama de clases de PlantUML.
2. Ejecuta automáticamente `postprocess-uml.js` para remover firmas de funciones standalone a nivel de raíz (por ejemplo, funciones de utilidades o enums como `rotateClockwise`), las cuales no son válidas en la sintaxis de diagramas de clase de PlantUML y causan errores al visualizarlo.

---

## Cómo Visualizar el Diagrama

Tienes tres formas principales de ver el diagrama de clases:

### Opción A: Extensión de VS Code (Recomendada)
1. Instala la extensión **"PlantUML"** (por *jebbs*) en tu VS Code.
2. Abre el archivo generado `classes.puml`.
3. Presiona la combinación de teclas **`Alt + D`** (o `Option + D` en macOS) para abrir el visor interactivo lateral.

### Opción B: PlantUML Online
1. Abre el archivo `classes.puml` y copia su contenido.
2. Ve al sitio oficial **[PlantUML Online Server](http://www.plantuml.com/plantuml)**.
3. Pega el código en el editor y el servidor renderizará la imagen automáticamente en la parte inferior.

### Opción C: Generación de Imagen Local (SVG/PNG)
Si tienes **Java** y **Graphviz** instalado en tu sistema local (`sudo apt install graphviz`), puedes generar archivos de imagen locales.
Por ejemplo, para exportar directamente a formato SVG:

```bash
pnpm exec tplant --input "src/**/*.ts" --output classes.svg && node postprocess-uml.js
```
