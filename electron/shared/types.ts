export interface SystemSnapshot {
  timestamp: number;
  cpuLoadPercent: number;
  cpuTempC: number | null;
  ramUsedGB: number;
  ramTotalGB: number;
  ramPercent: number;
  gpuName: string | null;
  gpuLoadPercent: number | null;
  gpuTempC: number | null;
  uptimeSeconds: number;
}

export interface NetworkStatus {
  ssid: string | null;
  signalPercent: number | null;
  interfaceType: string;
  pingMs: number | null;
}

export interface SpeedTestResult {
  downloadMbps: number;
  timestamp: number;
}

export interface DetectedGame {
  name: string;
  exe: string;
  pid: number;
}

export type OptimizationKey =
  | 'powerPlan'
  | 'windowsSearch'
  | 'windowsUpdate'
  | 'defenderScheduledScan'
  | 'defenderRealtime'
  | 'backgroundAppsPriority'
  | 'closeSelectedApps'
  | 'gamePriorityBoost';

export interface OptimizationSettings {
  autoDetectGames: boolean;
  enabled: Record<OptimizationKey, boolean>;
  closeAppsList: string[];
  priorityLowerList: string[];
}

export interface AppliedOptimization {
  key: OptimizationKey;
  label: string;
  success: boolean;
  detail: string;
}

export interface GameModeState {
  active: boolean;
  reason: 'manual' | 'auto-detect' | null;
  gameName: string | null;
  startedAt: number | null;
  applied: AppliedOptimization[];
}

export interface HistoryEntry {
  id: string;
  type: 'game-session' | 'speedtest' | 'snapshot';
  createdAt: number;
  title: string;
  detail: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  autoDetectGames: true,
  enabled: {
    powerPlan: true,
    windowsSearch: true,
    windowsUpdate: true,
    defenderScheduledScan: true,
    defenderRealtime: false,
    backgroundAppsPriority: true,
    closeSelectedApps: false,
    gamePriorityBoost: true
  },
  closeAppsList: [],
  priorityLowerList: ['OneDrive.exe', 'Discord.exe', 'Spotify.exe', 'Teams.exe', 'Skype.exe']
};

export const NITROBOOST_CHANNELS = {
  authHasAccount: 'auth:has-account',
  authRegister: 'auth:register',
  authLogin: 'auth:login',
  systemSnapshot: 'system:snapshot',
  systemProcessCount: 'system:process-count',
  networkStatus: 'network:status',
  networkSpeedTest: 'network:speedtest',
  gameModeGetState: 'gamemode:get-state',
  gameModeSetManual: 'gamemode:set-manual',
  gameModeStateChanged: 'gamemode:state-changed',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  historyList: 'history:list',
  historyClear: 'history:clear'
} as const;
