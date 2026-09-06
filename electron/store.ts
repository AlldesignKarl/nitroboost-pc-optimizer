import Store from 'electron-store';
import { DEFAULT_OPTIMIZATION_SETTINGS, HistoryEntry, OptimizationSettings } from './shared/types';

interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

interface StoreSchema {
  users: StoredUser[];
  settings: OptimizationSettings;
  history: HistoryEntry[];
}

const store = new Store<StoreSchema>({
  name: 'nitroboost-data',
  defaults: {
    users: [],
    settings: DEFAULT_OPTIMIZATION_SETTINGS,
    history: []
  }
});

export function getUsers(): StoredUser[] {
  return store.get('users');
}

export function addUser(user: StoredUser): void {
  const users = getUsers();
  users.push(user);
  store.set('users', users);
}

export function findUserByUsername(username: string): StoredUser | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function getSettings(): OptimizationSettings {
  return { ...DEFAULT_OPTIMIZATION_SETTINGS, ...store.get('settings') };
}

export function updateSettings(partial: Partial<OptimizationSettings>): OptimizationSettings {
  const merged = { ...getSettings(), ...partial };
  store.set('settings', merged);
  return merged;
}

const MAX_HISTORY = 500;

export function addHistoryEntry(entry: HistoryEntry): void {
  const history = store.get('history');
  history.unshift(entry);
  store.set('history', history.slice(0, MAX_HISTORY));
}

export function listHistory(): HistoryEntry[] {
  return store.get('history');
}

export function clearHistory(): void {
  store.set('history', []);
}
