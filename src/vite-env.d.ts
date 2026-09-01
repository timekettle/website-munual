/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 神策数据接收地址 */
  readonly VITE_SENSORS_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
