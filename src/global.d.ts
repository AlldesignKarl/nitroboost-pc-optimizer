import type { NitroboostApi } from '../electron/preload';

declare global {
  interface Window {
    nitroboost: NitroboostApi;
  }
}

export {};
