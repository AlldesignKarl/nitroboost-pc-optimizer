import si from 'systeminformation';
import activeWindow from 'active-win';
import { lookupGameName } from './knownGames';
import { DetectedGame } from './shared/types';

const SYSTEM_PROCESS_NAMES = new Set([
  'explorer.exe',
  'searchapp.exe',
  'shellexperiencehost.exe',
  'applicationframehost.exe',
  'textinputhost.exe'
]);

/**
 * Heurística de detección: primero busca coincidencias con la lista de juegos
 * conocidos entre los procesos activos; si no hay ninguna, comprueba si la
 * ventana en primer plano ocupa toda la pantalla (patrón típico de un juego).
 */
export async function detectRunningGame(): Promise<DetectedGame | null> {
  const processes = await si.processes();

  for (const proc of processes.list) {
    const nameLower = proc.name.toLowerCase();
    const known = lookupGameName(nameLower);
    if (known) {
      return { name: known, exe: proc.name, pid: proc.pid };
    }
  }

  try {
    const win = await activeWindow();
    if (win && isLikelyFullscreenGame(win)) {
      const exeName = win.owner.name;
      if (!SYSTEM_PROCESS_NAMES.has(exeName.toLowerCase())) {
        return { name: win.title || exeName, exe: exeName, pid: win.owner.processId };
      }
    }
  } catch {
    // active-win puede fallar si no hay permisos o no hay ventana activa; se ignora.
  }

  return null;
}

function isLikelyFullscreenGame(win: Awaited<ReturnType<typeof activeWindow>>): boolean {
  if (!win) return false;
  const { bounds } = win;
  if (!bounds) return false;
  return bounds.width >= 1280 && bounds.height >= 720 && bounds.x <= 0 && bounds.y <= 0;
}
