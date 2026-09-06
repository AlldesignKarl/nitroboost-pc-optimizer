import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NITROBOOST_CHANNELS, GameModeState, HistoryEntry } from './shared/types';
import { hasAnyAccount, loginUser, registerUser } from './auth';
import { getNetworkStatus, getProcessCount, getSystemSnapshot } from './systemMonitor';
import { runSpeedTest } from './speedTest';
import { detectRunningGame } from './gameDetector';
import { applyGameMode, revertGameMode } from './gameMode';
import { addHistoryEntry, clearHistory, getSettings, listHistory, updateSettings } from './store';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

const gameModeState: GameModeState = {
  active: false,
  reason: null,
  gameName: null,
  startedAt: null,
  applied: []
};

const MAX_SESSION_MS = 6 * 60 * 60 * 1000;
let sessionSafetyTimer: NodeJS.Timeout | null = null;
let detectionTimer: NodeJS.Timeout | null = null;
let snapshotTimer: NodeJS.Timeout | null = null;

function broadcastGameModeState() {
  mainWindow?.webContents.send(NITROBOOST_CHANNELS.gameModeStateChanged, gameModeState);
}

async function startGameMode(reason: 'manual' | 'auto-detect', gameName: string | null, gameExe: string | null) {
  if (gameModeState.active) return;
  const settings = getSettings();
  const applied = await applyGameMode(settings, gameExe);

  gameModeState.active = true;
  gameModeState.reason = reason;
  gameModeState.gameName = gameName;
  gameModeState.startedAt = Date.now();
  gameModeState.applied = applied;
  broadcastGameModeState();

  if (sessionSafetyTimer) clearTimeout(sessionSafetyTimer);
  sessionSafetyTimer = setTimeout(() => {
    void stopGameMode();
  }, MAX_SESSION_MS);
}

async function stopGameMode() {
  if (!gameModeState.active) return;
  await revertGameMode();

  const entry: HistoryEntry = {
    id: randomUUID(),
    type: 'game-session',
    createdAt: Date.now(),
    title: gameModeState.gameName ? `Sesión: ${gameModeState.gameName}` : 'Sesión de Modo Turbo',
    detail: `Duración: ${formatDuration(Date.now() - (gameModeState.startedAt ?? Date.now()))} · Optimizaciones aplicadas: ${gameModeState.applied.length}`
  };
  addHistoryEntry(entry);

  gameModeState.active = false;
  gameModeState.reason = null;
  gameModeState.gameName = null;
  gameModeState.startedAt = null;
  gameModeState.applied = [];
  broadcastGameModeState();

  if (sessionSafetyTimer) {
    clearTimeout(sessionSafetyTimer);
    sessionSafetyTimer = null;
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

function startAutoDetectionLoop() {
  if (detectionTimer) clearInterval(detectionTimer);
  detectionTimer = setInterval(async () => {
    const settings = getSettings();
    if (!settings.autoDetectGames) return;

    const detected = await detectRunningGame().catch(() => null);
    if (detected && !gameModeState.active) {
      await startGameMode('auto-detect', detected.name, detected.exe);
    } else if (!detected && gameModeState.active && gameModeState.reason === 'auto-detect') {
      await stopGameMode();
    }
  }, 8000);
}

function startSnapshotLoop() {
  if (snapshotTimer) clearInterval(snapshotTimer);
  snapshotTimer = setInterval(async () => {
    if (!mainWindow) return;
    const snapshot = await getSystemSnapshot().catch(() => null);
    if (snapshot) mainWindow.webContents.send(NITROBOOST_CHANNELS.systemSnapshot, snapshot);
  }, 3000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b0f14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle(NITROBOOST_CHANNELS.authHasAccount, () => hasAnyAccount());
  ipcMain.handle(NITROBOOST_CHANNELS.authRegister, (_e, username: string, password: string) =>
    registerUser(username, password)
  );
  ipcMain.handle(NITROBOOST_CHANNELS.authLogin, (_e, username: string, password: string) =>
    loginUser(username, password)
  );

  ipcMain.handle(NITROBOOST_CHANNELS.systemProcessCount, () => getProcessCount());
  ipcMain.handle(NITROBOOST_CHANNELS.networkStatus, () => getNetworkStatus());
  ipcMain.handle(NITROBOOST_CHANNELS.networkSpeedTest, async () => {
    const result = await runSpeedTest();
    addHistoryEntry({
      id: randomUUID(),
      type: 'speedtest',
      createdAt: Date.now(),
      title: 'Test de velocidad',
      detail: `Descarga: ${result.downloadMbps} Mbps`
    });
    return result;
  });

  ipcMain.handle(NITROBOOST_CHANNELS.gameModeGetState, () => gameModeState);
  ipcMain.handle(NITROBOOST_CHANNELS.gameModeSetManual, async (_e, activate: boolean) => {
    if (activate) {
      const detected = await detectRunningGame().catch(() => null);
      await startGameMode('manual', detected?.name ?? null, detected?.exe ?? null);
    } else {
      await stopGameMode();
    }
    return gameModeState;
  });

  ipcMain.handle(NITROBOOST_CHANNELS.settingsGet, () => getSettings());
  ipcMain.handle(NITROBOOST_CHANNELS.settingsUpdate, (_e, partial) => updateSettings(partial));

  ipcMain.handle(NITROBOOST_CHANNELS.historyList, () => listHistory());
  ipcMain.handle(NITROBOOST_CHANNELS.historyClear, () => clearHistory());
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  startAutoDetectionLoop();
  startSnapshotLoop();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (gameModeState.active) {
    void revertGameMode();
  }
  if (detectionTimer) clearInterval(detectionTimer);
  if (snapshotTimer) clearInterval(snapshotTimer);
  if (sessionSafetyTimer) clearTimeout(sessionSafetyTimer);
});
