# 2026-06-01 — Bootstrap del proyecto Arrow Maze Client

## Metadata
- **Herramienta:** GitHub Copilot (Claude Haiku 4.5)
- **Modelo / versión:** Claude Haiku 4.5
- **Autor humano responsable:** @Jrgil20
- **Fecha de generación:** 2026-06-01
- **Rama:** dev → main

---

## Prompt(s) representativo(s)

1. **Inicial:**
   > "ayudame a crear este proyecto pero con pnpm. React 18 + TypeScript + Vite, Empaquetado móvil con Capacitor (convierte web app a Android/iOS), con la estructura de carpetas especificada en carpetas.md"

2. **Refinamiento:**
   > "asegurate de agregar el git large files para los binarios y el git ignore"

---

## Salida tomada de la IA

### Scaffolding Vite + React

- ✅ Proyecto Vite inicializado con React 18 + TypeScript
- ✅ `package.json` configurado con scripts dev/build

### Dependencias instaladas

**Runtime:**
- `react@19.2.6`
- `react-dom@19.2.6`
- `axios@1.16.1` — cliente HTTP
- `zustand@5.0.14` — state management

**Dev Dependencies:**
- `@capacitor/core@8.3.4` y `@capacitor/cli@8.3.4` — framework móvil
- `@capacitor/android@8.3.4` y `@capacitor/ios@8.3.4` — plataformas móviles
- `jest@30.4.2`, `@testing-library/react@16.3.2`, `ts-jest@29.4.11` — testing
- `typescript@6.0.3`, `vite@8.0.16`, `@vitejs/plugin-react@6.0.2` — build toolchain

### Estructura de carpetas (Clean Architecture + DDD)

```
src/
├── domain/                          # Capa 1: Lógica pura (DDD)
│   ├── entities/
│   │   ├── Direction.ts             # Enum y rotaciones (UP, DOWN, LEFT, RIGHT)
│   │   ├── Cell.ts                  # Celda con flecha y tipo (NORMAL, WALL, EXIT)
│   │   ├── Player.ts                # Posición, movimientos, tiempo
│   │   ├── Board.ts                 # Grid de celdas
│   │   └── Level.ts                 # Definición de nivel + dificultad
│   ├── value-objects/
│   │   ├── Position.ts              # (x, y) con validación
│   │   └── Score.ts                 # Puntuación inmutable
│   ├── events/
│   │   └── GameEvents.ts            # PlayerMoved, LevelCompleted, GameOver
│   └── services/
│       └── PathChecker.ts           # Validar si flecha llega a salida (BFS)
│
├── application/                     # Capa 2: Casos de uso
│   ├── ports/
│   │   ├── ILevelRepository.ts      # Interfaz para acceso a niveles
│   │   └── IScoreRepository.ts      # Interfaz para acceso a puntuaciones
│   ├── use-cases/
│   │   └── LoadLevelUseCase.ts      # Cargar nivel y crear board
│   └── dtos/
│       └── GameDTOs.ts              # DTO para MovePlayer, CompleteLevel, LoadLevel
│
├── data/                            # Capa 3: Adaptadores (implementaciones)
│   ├── repositories/
│   │   ├── LocalLevelRepository.ts  # Levels en memoria (con 3 niveles de ejemplo)
│   │   └── LocalScoreRepository.ts  # Scores en localStorage
│   └── (datasources, mappers, models — estructura lista)
│
├── infrastructure/                  # Capa 4: Detalles técnicos
│   ├── config/
│   │   └── api-config.ts            # URLs, timeouts, endpoints
│   └── (services, aop, di — estructura lista)
│
├── presentation/                    # Capa 5: UI React (futuro)
│   ├── screens/
│   ├── components/
│   ├── hooks/
│   ├── context/
│   └── utils/
│
└── App.tsx, main.tsx, index.css
```

### Archivos generados (Dominio — DDD)

#### `src/domain/entities/Direction.ts`
- Enum con `UP | DOWN | LEFT | RIGHT`
- Funciones `rotateClockwise()` y `rotateCounterClockwise()`

#### `src/domain/value-objects/Position.ts`
- Value object inmutable `(x, y)` con validación de enteros
- Método `equals()` y `toString()`

#### `src/domain/entities/Cell.ts`
- Entidad con posición, dirección, tipo (NORMAL, WALL, EXIT)
- Métodos: `canTraverse()`, `isExit()`, setters y getters
- Enum `CellType`

#### `src/domain/entities/Player.ts`
- Posición, contador de movimientos, timer
- Métodos: `getMoves()`, `getElapsedTime()`, reset

#### `src/domain/entities/Board.ts`
- Grid de celdas con map interno `Map<string, Cell>`
- Métodos: `setCell()`, `getCell()`, `isWithinBounds()`
- Validación de dimensiones positivas

#### `src/domain/entities/Level.ts`
- Inmutable: id, nombre, dificultad, ancho/alto, tiempo/movimientos límite
- Enum `Difficulty: EASY | MEDIUM | HARD`
- Getters para todos los atributos

#### `src/domain/value-objects/Score.ts`
- Inmutable: levelId, points, moves, time, date
- Método `isHighScore()` para comparar

#### `src/domain/events/GameEvents.ts`
- Clase base abstracta `DomainEvent` con timestamp y aggregateId
- Eventos: `PlayerMoved`, `LevelCompleted`, `GameOver`

#### `src/domain/services/PathChecker.ts`
- Servicio de dominio `PathChecker.canReachExit()`
- Implementa BFS para verificar si una celda alcanza la salida siguiendo flechas

### Archivos generados (Application)

#### `src/application/ports/ILevelRepository.ts`
- Interfaz: `getLevel()`, `getAllLevels()`, `getLevelsByDifficulty()`

#### `src/application/ports/IScoreRepository.ts`
- Interfaz: `saveScore()`, `getScores()`, `getHighScore()`, `getAllScores()`

#### `src/application/dtos/GameDTOs.ts`
- `MovePlayerRequest`, `MovePlayerResult`
- `CompleteLevelResult`, `LoadLevelResult`

#### `src/application/use-cases/LoadLevelUseCase.ts`
- Caso de uso: cargar nivel y crear board
- Inicializa grid 5x5 a 10x10 según nivel
- Retorna `LoadLevelResult` con posición inicial del jugador

### Archivos generados (Data)

#### `src/data/repositories/LocalLevelRepository.ts`
- Implementa `ILevelRepository`
- Carga 3 niveles de ejemplo en memoria (Level 1: EASY 5x5, Level 2: MEDIUM 7x7, Level 3: HARD 10x10)

#### `src/data/repositories/LocalScoreRepository.ts`
- Implementa `IScoreRepository`
- Persistencia en `localStorage` con key `arrow_maze_scores`
- Serialización/deserialización de Score

### Archivos generados (Infrastructure)

#### `src/infrastructure/config/api-config.ts`
- Configuración centralizada: `BASE_URL`, `TIMEOUT`, endpoints

### Configuración de Testing

#### `jest.config.js`
- Preset `ts-jest` para TypeScript
- Test environment: `jsdom`
- Roots: `src/` y `__tests__/`
- Coverage paths excluyen `.d.ts` e índices

#### `jest-setup.ts`
- Setup de `@testing-library/jest-dom`
- Mock de `window.matchMedia()`

### Configuración de Git

#### `.gitignore` — completo
- Node.js: `node_modules/`, `pnpm-lock.yaml`, logs
- Vite: `dist/`, `.vite/`
- Capacitor: `ios/`, `android/`, `.capacitor/`
- IDEs: `.vscode/`, `.idea/`, archivos de editor
- Env: `.env`, `.env.local`
- Testing: `coverage/`, `jest-coverage/`
- OS: `.DS_Store`, `Thumbs.db`

#### `.gitattributes` — Git LFS
- Imágenes: `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`, `*.svg`, `*.ico`
- Audio: `*.mp3`, `*.wav`, `*.ogg`, `*.m4a`
- Video: `*.mp4`, `*.webm`, `*.mov`
- Fuentes: `*.ttf`, `*.otf`, `*.woff`, `*.woff2`
- Documentos: `*.pdf`

### Configuración de React + TypeScript

#### `src/App.tsx`
- Componente funcional con TypeScript
- Header con título y descripción
- Botón "Start Game" (placeholder)

#### `src/App.css`
- CSS personalizado con variables CSS (colores primarios, secondary, estados)
- Responsive design (mobile-first)
- Estilos para botones, header, welcome section

#### `capacitor.config.ts` (generado automáticamente)
- Nombre: "Arrow Maze"
- Package ID: `com.arrowmaze.app`
- Plataformas: Android e iOS configuradas

#### `vite.config.ts` (generado automáticamente)
- React plugin activado
- Salida TypeScript

---

## Modificaciones manuales del equipo

✅ **Completado automáticamente por el generador:**
- Vite CLI creó la estructura base
- pnpm instaló todas las dependencias correctamente
- Capacitor inicializó config y agregó plataformas

❌ **Pendiente de revisión/ajustes:**
- [ ] Completar `presentation/screens/` con componentes principales (HomeScreen, GameScreen, etc.)
- [ ] Implementar `MovePlayerUseCase`, `CompleteLevelUseCase`, `SaveProgressUseCase`
- [ ] Completar `data/datasources/` y `data/mappers/`
- [ ] Implementar `DIContainer.ts` para inyección de dependencias
- [ ] Configurar `tsconfig.json` con rutas absolutas (`@/`)
- [ ] Crear `README.md` con setup y documentación de arquitectura
- [ ] Completar tests en `__tests__/`

---

## Validación realizada

### ✅ Validación estructural
- [x] Proyecto Vite se inició correctamente con `pnpm create vite`
- [x] React 18, TypeScript, Vite instalados sin conflictos
- [x] Estructura de carpetas matches `carpetas.md` design
- [x] Clean Architecture con 4 capas implementada parcialmente (Domain, Application, Data, Infrastructure)
- [x] DDD: entidades con identidad, value objects, eventos, servicios de dominio
- [x] Capacitor configurado con Android + iOS

### ✅ Validación de dependencias
- [x] `pnpm-lock.yaml` generated y reproducible
- [x] Todas las devDependencies resueltas sin warnings críticos
- [x] Git LFS instalado localmente

### ✅ Validación de Git
- [x] Repositorio inicializado (`git init`)
- [x] Git LFS hooks activados
- [x] `.gitattributes` y `.gitignore` commiteados
- [x] Commit inicial: `chore: configure Git LFS and .gitignore`

### ⚠️ Validación pendiente
- [ ] No se ejecutó `npm run build` (genera dist/ que está en .gitignore)
- [ ] No se ejecutó `npm run lint` (ESLint no configurado aún)
- [ ] No se ejecutó `npm run test` (tests no implementados aún)
- [ ] No se ejecutó `npx cap sync` (aún no hay dist/, es necesario después de compilar)

### 🏗️ Completado correctamente
- ✅ Dominio: 8 archivos de entidades, value objects, eventos, servicios
- ✅ Application: 2 puertos, 1 use case, DTOs
- ✅ Data: 2 repositorios (memory + localStorage)
- ✅ Infrastructure: configuración de API
- ✅ Testing: Jest + Testing Library configurados
- ✅ Git: LFS, .gitignore, .gitattributes
- ✅ Capacitor: Android + iOS agregados

---

## Notas técnicas

### Decisions de Arquitectura

1. **State Management:** Zustand elegido (más ligero que Redux, mejor que Context para este caso)
2. **Persistencia:** Dual (localStorage local + API futura con axios)
3. **Testing:** Jest + Testing Library (estándar React)
4. **Mobile:** Capacitor para convertir web → Android/iOS sin código nativo

### Estructura de niveles (LocalLevelRepository)

```
Level 1: "First Steps"      → EASY   5x5 grid, 60s, 20 moves max
Level 2: "Challenge Time"   → MEDIUM 7x7 grid, 90s, 30 moves max
Level 3: "Master"           → HARD   10x10 grid, 120s, 50 moves max
```

### Patrón de Grid (Board)

- Usa `Map<string, Cell>` internamente (key = `"x,y"`)
- Búsqueda O(1), búsqueda de paths O(n)
- BFS en `PathChecker` para validar alcanzabilidad de salida

---

## Próximos pasos recomendados

1. **Completar Presentation Layer:**
   - `HomeScreen.tsx`, `LevelSelectionScreen.tsx`, `GameScreen.tsx`
   - `BoardComponent.tsx`, `CellComponent.tsx`
   - Router (React Router v6)

2. **Implementar Use Cases restantes:**
   - `MovePlayerUseCase.ts` (rotar flecha + validar movimiento)
   - `CompleteLevelUseCase.ts` (verificar victoria)
   - `SaveProgressUseCase.ts`, `SyncProgressUseCase.ts`
   - `CommandHistory.ts` (undo/redo)

3. **Configurar DI:**
   - `DIContainer.ts` para resolver dependencias
   - Inyectar en `GameContext.ts` o `useGame.ts` hook

4. **Datos de niveles:**
   - Crear JSON files en `assets/levels/` con configuración de celdas por nivel
   - Parser en `JsonDS.ts`

5. **Tests:**
   - Unit tests para entidades de dominio (Board, Cell, Player)
   - Integration tests para PathChecker
   - Component tests para React

6. **Build & Deploy:**
   - `pnpm run build` → generar dist/
   - `npx cap sync` → sincronizar con Android/iOS
   - Web hosting (Vercel, Netlify, etc.)

---

**Registro completado:** 2026-06-01 10:30 UTC
