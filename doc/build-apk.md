# Build APK — Proceso de distribución Android

## Prerequisitos

- **Git LFS** instalado y configurado (`sudo apt install git-lfs && git lfs install`)
- **Android Studio** con SDK 36 instalado
- **JDK 21 completo** instalado (`openjdk-21-jdk`, no solo la JVM/runtime)
- **pnpm** como package manager

## Pasos

### 1. Verificar binarios Git LFS

Los archivos de audio (`public/audio/**/*.mp3`) e imágenes se gestionan con Git LFS.
Antes de hacer build, verificar que son binarios reales y no punteros:

```bash
file public/audio/sfx/advanced.mp3
# ✅ Esperado: "MPEG ADTS, layer III, ..."
# ❌ Error:    "ASCII text" → ejecutar: git lfs pull
```

### 2. Build offline

El APK usa el modo offline (sin backend remoto). Esto setea `VITE_OFFLINE_MODE=true`
y excluye el FORGE del bundle:

```bash
pnpm run build:apk
```

Este comando ya ejecuta el flujo completo: build offline, `cap sync android` y
`assembleDebug`, por lo que deja los assets en `dist/` y el APK en
`android/app/build/outputs/apk/debug/`.

### 3. Sincronizar con el proyecto nativo

Copia los web assets a `android/app/src/main/assets/public/` y actualiza la config
nativa (incluyendo `capacitor.config.ts` → `capacitor.config.json`):

```bash
pnpm dlx cap sync android
```

### 4. Build del APK

#### Opción A — Android Studio (recomendado para release firmado)

```bash
pnpm dlx cap open android
```

En Android Studio: **Build → Generate Signed Bundle / APK → APK**.

#### Opción B — Línea de comandos (debug)

```bash
cd android && ./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/`.

## Resumen rápido

```bash
git lfs pull                    # binarios reales
pnpm run build:apk              # build web offline
pnpm dlx cap sync android       # sync nativo
pnpm dlx cap open android       # abrir en Android Studio
```

## Troubleshooting

### Progreso no se guarda

- Desinstalar la app del dispositivo antes de instalar una nueva versión
  (evita conflictos con BD SQLite restaurada por backup).
- Verificar que `capacitor.config.ts` tiene `androidIsEncryption: false`.

### Gradle dice que falta `JAVA_COMPILER`

- El sistema tiene Java pero no `javac`.
- Instalar el paquete completo del JDK 21, por ejemplo: `sudo apt install openjdk-21-jdk`.
- Confirmar con `javac -version` antes de volver a correr `pnpm run build:apk`.

### Audio no suena

- Verificar que los `.mp3` no son punteros Git LFS (`file public/audio/sfx/*.mp3`).
- Si son punteros: `git lfs pull`.
