# Plan Maestro — Arrow Maze (Roadmap completo)

## Estado del código base a 2026-06-12

> 131 tests pasando · 9 suites · Clean Architecture en 3 capas · Motor de movimiento completo

### Lo que ya existe

| Feature | Capa | Estado |
|---|---|---|
| **A1** — Grafo de nodos (Board + Cell con puerto-based topology) | domain + application + infra | ✅ Completo |
| **A2** — Entidades como listas enlazadas (Arrow → Head → Segment chain) | domain + application | ✅ Completo |
| **A3** — Resolución y desplazamiento (advance engine + AdvanceArrowUseCase) | domain + application | ✅ Completo |
| **A4** — Detección de victoria/derrota | — | ❌ Pendiente |
| **A5** — Cálculo de puntuación | — | ❌ Pendiente |
| **B1** — Renderizado visual | presentation | ❌ Pendiente |
| **B2** — Animaciones y retroalimentación | presentation | ❌ Pendiente |
| **B3** — Entrada del jugador | presentation | ❌ Pendiente |
| **C1** — Máquina de estados de partida | application | ❌ Pendiente |
| **C2** — Carga y deserialización de niveles | infra (parcial) | ⚠️ LevelData schema existe; repo InMemory listo; falta loader de archivos locales |
| **C3** — Selección de niveles + progreso | presentation | ❌ Pendiente |
| **C4** — Pantallas de soporte (inicio, victoria, derrota, pausa, ajustes) | presentation | ❌ Pendiente |
| **D1** — Persistencia local SQLite | infra | ❌ Pendiente |
| **D2** — Sincronización remota | infra | ❌ Pendiente |

---

## Grafo de dependencias

```
A1 ──► A2 ──► A3 ──► A4 ──► A5 ──► D1 ──► D2
                       │
                       ▼
              C1 ──► C4
              │
        A1,A2 ▼
              C2 ──► C3 ◄─── D1
              │
        A1,A2 ▼
              B1 ──► B2 ──► B3
              │              │
              └──────────────► (C3, C4 consumen)
```

---

## Fases de implementación

### FASE 1 — Motor de juego completo (capas domain + application)
*Prerequisito para todo lo demás. Sin presentación.*

| ID | Feature | Capa principal | Nuevos artefactos clave |
|---|---|---|---|
| **A4** | Detección victoria/derrota | domain + application | `GameStateEvaluator` (domain service), `EvaluateGameStateUseCase` |
| **A5** | Puntuación por sesión | domain + application | `Score` VO, `ComputeScoreUseCase` |
| **C2** | Carga de niveles desde archivos locales | infra | `JsonLevelRepository` (impl `ILevelRepository`) |
| **C1** | Máquina de estados de partida | application | `GameSession` (aggregate), `GameStateMachine` |

**Orden dentro de la fase:** A4 → A5 → C2 → C1

---

### FASE 2 — Persistencia local (infrastructure)
*Depende de A5, C1.*

| ID | Feature | Capa principal | Nuevos artefactos clave |
|---|---|---|---|
| **D1** | Persistencia SQLite (progreso + puntuaciones) | infra | `SqliteProgressRepository`, `IProgressRepository` port |

---

### FASE 3 — Renderizado y presentación (presentation layer)
*Depende de toda la Fase 1 + A1–A3 existentes.*

| ID | Feature | Capa principal | Nuevos artefactos clave |
|---|---|---|---|
| **B1** | Renderizado visual del tablero | presentation | `BoardRenderer` component, Canvas/SVG layer |
| **B2** | Animaciones y retroalimentación | presentation | `AnimationController`, CSS/GSAP transitions |
| **B3** | Captura y enrutamiento de entrada | presentation | `InputRouter`, event listeners, touch support |

**Orden:** B1 → B3 → B2

---

### FASE 4 — Flujo y pantallas (presentation)
*Depende de C1, D1, B1.*

| ID | Feature | Capa principal | Nuevos artefactos clave |
|---|---|---|---|
| **C3** | Selección de niveles + progreso | presentation | `LevelSelectScreen` |
| **C4** | Pantallas de soporte (inicio, victoria, derrota, pausa, ajustes) | presentation | `StartScreen`, `WinScreen`, `LoseScreen`, `PauseOverlay`, `SettingsPanel` |

---

### FASE 5 — Sincronización remota
*Depende de D1.*

| ID | Feature | Capa principal | Nuevos artefactos clave |
|---|---|---|---|
| **D2** | Sync remoto con servidor | infra | `HttpSyncAdapter`, `ISyncPort` |

---

## Open Questions

> [!IMPORTANT]
> Responder antes de diseñar A4.
>
> 1. **Condición de victoria:** ¿el tablero queda vacío cuando *todas* las flechas han sido destruidas (salida por sink)? ¿O hay celdas especiales de "meta"?
> 2. **Condición de derrota:** ¿se evalúa tras cada tick? ¿Qué cuenta como "movimientos disponibles agotados"? ¿Es un número fijo por nivel o dinámico?
> 3. **Múltiples flechas:** A3 ya mueve una flecha por tick. ¿El motor avanza todas las flechas simultáneamente o en orden definido?
> 4. **Puntuación (A5):** ¿qué variables componen el score? (tiempo, movimientos restantes, tamaño de flecha al destruirse, bonificadores)
> 5. **Formato de nivel (C2):** ¿ya existe un `.json` de ejemplo, o se diseña ahora? ¿Los niveles se empaquetan en `public/` o se cargan desde el sistema de archivos nativo (Capacitor)?
> 6. **SQLite (D1):** ¿se usa `@capacitor-community/sqlite` u otra librería? ¿El progreso es solo por nivel completado + puntuación máxima?
> 7. **D2 (sync remoto):** ¿existe ya un backend? Si no, ¿D2 queda fuera del alcance actual?

---

## Verificación plan (checklist pre-handoff)

- [ ] A4 especificado con condiciones exactas de victoria/derrota
- [ ] A5 con fórmula de score definida
- [ ] C2 con formato JSON de nivel acordado
- [ ] C1 con estados enumerados y transiciones válidas
- [ ] Cada feature tiene Gherkin en `features/` y plan en `doc/`
- [ ] Archivos intocables listados explícitamente por feature
- [ ] TDD ciclo Red→Green→Refactor verificado por fase
