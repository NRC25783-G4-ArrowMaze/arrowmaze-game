/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API del backend (default: http://localhost:3000). */
  readonly VITE_API_BASE_URL?: string
  /** 'true' desactiva todo intento de red (build de distribución offline). */
  readonly VITE_OFFLINE_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const content: string
  export default content
}
