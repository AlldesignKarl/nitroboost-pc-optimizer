import { contextBridge, ipcRenderer } from 'electron';
import { NITROBOOST_CHANNELS } from './shared/types';
import type {
  AuthResult,
  GameModeState,
  HistoryEntry,
  NetworkStatus,
  OptimizationSettings,
  SpeedTestResult,
  SystemSnapshot
} from './shared/types';

const api = {
  auth: {
    hasAccount: (): Promise<boolean> => ipcRenderer.invoke(NITROBOOST_CHANNELS.authHasAccount),
    register: (username: string, password: string): Promise<AuthResult> =>
      ipcRenderer.invoke(NITROBOOST_CHANNELS.authRegister, username, password),
    login: (username: string, password: string): Promise<AuthResult> =>
      ipcRenderer.invoke(NITROBOOST_CHANNELS.authLogin, username, password)
  },
  system: {
    onSnapshot: (cb: (snapshot: SystemSnapshot) => void) => {
      const listener = (_e: unknown, snapshot: SystemSnapshot) => cb(snapshot);
      ipcRenderer.on(NITROBOOST_CHANNELS.systemSnapshot, listener);
      return () => {
        ipcRenderer.removeListener(NITROBOOST_CHANNELS.systemSnapshot, listener);
      };
    },
    getProcessCount: (): Promise<number> => ipcRenderer.invoke(NITROBOOST_CHANNELS.systemProcessCount)
  },
  network: {
    getStatus: (): Promise<NetworkStatus> => ipcRenderer.invoke(NITROBOOST_CHANNELS.networkStatus),
    runSpeedTest: (): Promise<SpeedTestResult> => ipcRenderer.invoke(NITROBOOST_CHANNELS.networkSpeedTest)
  },
  gameMode: {
    getState: (): Promise<GameModeState> => ipcRenderer.invoke(NITROBOOST_CHANNELS.gameModeGetState),
    setManual: (activate: boolean): Promise<GameModeState> =>
      ipcRenderer.invoke(NITROBOOST_CHANNELS.gameModeSetManual, activate),
    onStateChanged: (cb: (state: GameModeState) => void) => {
      const listener = (_e: unknown, state: GameModeState) => cb(state);
      ipcRenderer.on(NITROBOOST_CHANNELS.gameModeStateChanged, listener);
      return () => {
        ipcRenderer.removeListener(NITROBOOST_CHANNELS.gameModeStateChanged, listener);
      };
    }
  },
  settings: {
    get: (): Promise<OptimizationSettings> => ipcRenderer.invoke(NITROBOOST_CHANNELS.settingsGet),
    update: (partial: Partial<OptimizationSettings>): Promise<OptimizationSettings> =>
      ipcRenderer.invoke(NITROBOOST_CHANNELS.settingsUpdate, partial)
  },
  history: {
    list: (): Promise<HistoryEntry[]> => ipcRenderer.invoke(NITROBOOST_CHANNELS.historyList),
    clear: (): Promise<void> => ipcRenderer.invoke(NITROBOOST_CHANNELS.historyClear)
  }
};

contextBridge.exposeInMainWorld('nitroboost', api);

export type NitroboostApi = typeof api;
