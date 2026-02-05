/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // Публичный ключ терминала TipTop для платежного виджета
  readonly VITE_TIP_TOP_PUBLIC_KEY?: string;
  // На случай, если переменная задана без префикса VITE_
  readonly TIP_TOP_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

