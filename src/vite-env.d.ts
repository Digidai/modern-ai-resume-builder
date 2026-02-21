/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AI_PROXY_URL?: string
    readonly VITE_SITE_URL?: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
