# AI Usage Registry — Arrow Maze Client

Registro centralizado de uso de herramientas de IA en el desarrollo del cliente web de **Arrow Maze**, en cumplimiento de las reglas del proyecto.

## Índice de reportes

| Fecha | Descripción | Archivo | Modelo |
|-------|-------------|---------|--------|
| 2026-06-01 | Bootstrap del proyecto (Vite + React + TypeScript + Capacitor, estructura de carpetas, dominio DDD inicial) | [`2026-06-01-initial-scaffold.md`](./2026-06-01-initial-scaffold.md) | Claude Haiku 4.5 |
| 2026-06-01 | Capa de Dominio basada en puertos e Infraestructura/Aplicación (TDD) | [`2026-06-01-domain-infra-application-layer.md`](./2026-06-01-domain-infra-application-layer.md) | Claude Sonnet 4.6 |
| 2026-06-02 | Configuración de PlantUML y generador de diagramas de clase | [`2026-06-02-plantuml-setup.md`](./2026-06-02-plantuml-setup.md) | Gemini 3.5 Flash |

---

## Formato de reportes

Cada entrada en este registro sigue el formato estándar:

```markdown
### YYYY-MM-DD — <Resumen de la tarea>
- **Herramienta:** <Cursor / Claude / GPT / Copilot / etc.>
- **Modelo / versión:** <si se conoce>
- **Autor humano responsable:** <nombre o handle>
- **Prompt(s) representativo(s):**
  - "..."
- **Salida tomada de la IA:** <archivos / bloques principales generados>
- **Modificaciones manuales del equipo:** <qué se ajustó, por qué>
- **Validación realizada:** <tests, lint, revisión humana>
```

---

## Estadísticas

- **Total de reportes:** 3
- **Última actualización:** 2026-06-02
- **Modelos usados:** Claude Haiku 4.5 (1), Claude Sonnet 4.6 (1), Gemini 3.5 Flash (1), Copilot (1)
- **Herramientas:** GitHub Copilot (1), Antigravity (Gemini / Claude) (2)

---

## Reglas para contribuidores

Al agregar IA assistance a este proyecto:

1. ✅ **Crear un nuevo reporte** en esta carpeta (naming: `YYYY-MM-DD-descripcion.md`)
2. ✅ **Registrar el archivo** en este INDEX (`README.md`)
3. ✅ **Incluir metadata completa:** herramienta, modelo, autor, prompts, salida, validación
4. ✅ **Commitearlo junto** con el código generado
5. ✅ **Abrir PR** con referencia a este reporte

---

> Para más contexto sobre las reglas del proyecto, consulta [`CONTRIBUTING.md`](../CONTRIBUTING.md) y [`.cursor/rules/`](../.cursor/rules/).
