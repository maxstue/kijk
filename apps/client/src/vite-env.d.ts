/// <reference types="vite/client" />

interface ImportMetaEnv {
  // VITE
  DEV: boolean;
  PROD: boolean;
  // Base
  VITE_BASE_API_URL: string;
  VITE_API_URL: string;
  // Devtools
  VITE_DEVTOOLS_LOGGER: string;
  // Auth
  VITE_KINDE_CLIENT_ID: string;
  VITE_KINDE_DOMAIN: string;
  VITE_KINDE_AUDIENCE: string;
  VITE_KINDE_REDIRECT_URL: string;
  VITE_KINDE_LOGOUT_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const SHORT_APP_VERSION: string;
declare const LONG_APP_VERSION: string;
