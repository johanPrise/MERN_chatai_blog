/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGO_URI: string;
  // more env variables...
}


interface ImportMeta {
    readonly env: ImportMetaEnv
  }
