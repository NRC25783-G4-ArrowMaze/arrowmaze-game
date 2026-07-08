Create the scaffolding for a new feature following the project conventions.

Feature name: $ARGUMENTS

Steps:
1. Read `doc/feature3_plan.md` to understand the plan format used in this project.
2. Read `features/arrow_movement.feature` to understand the Gherkin format used.
3. Create `features/<feature-name>.feature` with a skeleton Background + at least one Scenario block (leave scenarios for the user to fill in).
4. Create `doc/<feature-name>_plan.md` with the following sections:
   - **Resumen** — one-paragraph description
   - **Decisiones de Diseño** — empty table with columns: #, Decisión, Resolución
   - **Propuesta de Cambios** — subsections per layer (domain errors, entities, value objects, application DTOs, use cases, tests)
   - **Archivos que NO se tocan** — placeholder list
   - **Orden de Implementación** — empty table
   - **Riesgos Identificados** — empty table
   - **Criterios de Completitud** — empty checklist
5. Report which files were created and the next steps for the user.

Do NOT implement any code — this command only creates the planning scaffolding.
