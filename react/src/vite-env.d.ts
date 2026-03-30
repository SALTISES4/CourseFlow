/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Django API origin: scheme + host + port, no trailing slash. Example: http://127.0.0.1:8000 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
