import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { AppliedOptimization, OptimizationSettings } from './shared/types';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

const HIGH_PERFORMANCE_GUID = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';

interface RevertState {
  previousPowerPlanGuid: string | null;
  loweredProcesses: string[];
  windowsSearchStopped: boolean;
  windowsUpdatePaused: boolean;
  defenderScheduledScanDisabled: boolean;
  defenderRealtimeDisabled: boolean;
}

let revertState: RevertState | null = null;

async function run(cmd: string): Promise<{ ok: boolean; output: string }> {
  if (!isWindows) {
    return { ok: false, output: 'Solo disponible en Windows.' };
  }
  try {
    const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, {
      timeout: 10000
    });
    return { ok: true, output: (stdout || stderr).trim() };
  } catch (err) {
    return { ok: false, output: err instanceof Error ? err.message : String(err) };
  }
}

export async function applyGameMode(
  settings: OptimizationSettings,
  gameExeToBoost: string | null
): Promise<AppliedOptimization[]> {
  const applied: AppliedOptimization[] = [];
  revertState = {
    previousPowerPlanGuid: null,
    loweredProcesses: [],
    windowsSearchStopped: false,
    windowsUpdatePaused: false,
    defenderScheduledScanDisabled: false,
    defenderRealtimeDisabled: false
  };

  if (settings.enabled.powerPlan) {
    const current = await run('(powercfg /getactivescheme)');
    const match = current.output.match(/([0-9a-fA-F-]{36})/);
    if (match) revertState.previousPowerPlanGuid = match[1];
    const result = await run(`powercfg /s ${HIGH_PERFORMANCE_GUID}`);
    applied.push({
      key: 'powerPlan',
      label: 'Plan de energía en Alto rendimiento',
      success: result.ok,
      detail: result.ok ? 'Activado' : result.output
    });
  }

  if (settings.enabled.windowsSearch) {
    const result = await run('Stop-Service -Name WSearch -Force -ErrorAction Stop');
    revertState.windowsSearchStopped = result.ok;
    applied.push({
      key: 'windowsSearch',
      label: 'Pausar indexado de Windows Search',
      success: result.ok,
      detail: result.ok ? 'Servicio detenido' : result.output
    });
  }

  if (settings.enabled.windowsUpdate) {
    const result = await run('UsoClient.exe PauseUpdates');
    revertState.windowsUpdatePaused = result.ok;
    applied.push({
      key: 'windowsUpdate',
      label: 'Pausar descargas de Windows Update',
      success: result.ok,
      detail: result.ok ? 'Pausado temporalmente' : result.output
    });
  }

  if (settings.enabled.defenderScheduledScan) {
    const result = await run(
      'Disable-ScheduledTask -TaskName "Windows Defender Scheduled Scan" -TaskPath "\\Microsoft\\Windows\\Windows Defender\\" -ErrorAction Stop'
    );
    revertState.defenderScheduledScanDisabled = result.ok;
    applied.push({
      key: 'defenderScheduledScan',
      label: 'Pausar análisis programado de Defender (protección en tiempo real sigue activa)',
      success: result.ok,
      detail: result.ok ? 'Análisis programado pausado' : result.output
    });
  }

  if (settings.enabled.defenderRealtime) {
    const result = await run('Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction Stop');
    revertState.defenderRealtimeDisabled = result.ok;
    applied.push({
      key: 'defenderRealtime',
      label: '⚠️ Protección en tiempo real de Defender desactivada temporalmente',
      success: result.ok,
      detail: result.ok
        ? 'Se reactivará automáticamente al salir del Modo Turbo'
        : result.output
    });
  }

  if (settings.enabled.backgroundAppsPriority) {
    for (const exe of settings.priorityLowerList) {
      const result = await run(
        `Get-Process -Name "${exe.replace(/\.exe$/i, '')}" -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'BelowNormal' }`
      );
      if (result.ok) revertState.loweredProcesses.push(exe);
    }
    applied.push({
      key: 'backgroundAppsPriority',
      label: `Bajar prioridad de ${settings.priorityLowerList.length} apps en segundo plano`,
      success: true,
      detail: revertState.loweredProcesses.join(', ') || 'Ninguna app coincidente en ejecución'
    });
  }

  if (settings.enabled.closeSelectedApps && settings.closeAppsList.length > 0) {
    const results: string[] = [];
    for (const exe of settings.closeAppsList) {
      const result = await run(`Stop-Process -Name "${exe.replace(/\.exe$/i, '')}" -Force -ErrorAction SilentlyContinue`);
      results.push(exe);
    }
    applied.push({
      key: 'closeSelectedApps',
      label: 'Cerrar apps marcadas manualmente por el usuario',
      success: true,
      detail: results.join(', ')
    });
  }

  if (settings.enabled.gamePriorityBoost && gameExeToBoost) {
    const result = await run(
      `Get-Process -Name "${gameExeToBoost.replace(/\.exe$/i, '')}" -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'High' }`
    );
    applied.push({
      key: 'gamePriorityBoost',
      label: `Prioridad alta para ${gameExeToBoost}`,
      success: result.ok,
      detail: result.ok ? 'Aplicado' : result.output
    });
  }

  return applied;
}

export async function revertGameMode(): Promise<void> {
  if (!revertState) return;
  const state = revertState;
  revertState = null;

  if (state.previousPowerPlanGuid) {
    await run(`powercfg /s ${state.previousPowerPlanGuid}`);
  }
  if (state.windowsSearchStopped) {
    await run('Start-Service -Name WSearch -ErrorAction SilentlyContinue');
  }
  if (state.windowsUpdatePaused) {
    await run('UsoClient.exe ResumeUpdates');
  }
  if (state.defenderScheduledScanDisabled) {
    await run(
      'Enable-ScheduledTask -TaskName "Windows Defender Scheduled Scan" -TaskPath "\\Microsoft\\Windows\\Windows Defender\\" -ErrorAction SilentlyContinue'
    );
  }
  if (state.defenderRealtimeDisabled) {
    await run('Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue');
  }
  for (const exe of state.loweredProcesses) {
    await run(
      `Get-Process -Name "${exe.replace(/\.exe$/i, '')}" -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'Normal' }`
    );
  }
}
