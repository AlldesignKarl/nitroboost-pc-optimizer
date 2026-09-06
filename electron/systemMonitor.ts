import si from 'systeminformation';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SystemSnapshot, NetworkStatus } from './shared/types';

const execAsync = promisify(exec);

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [load, mem, temp, graphics, time] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.cpuTemperature(),
    si.graphics(),
    si.time()
  ]);

  const gpu = graphics.controllers[0];
  const gpuLoadRaw = (gpu as unknown as { utilizationGpu?: number })?.utilizationGpu;

  return {
    timestamp: Date.now(),
    cpuLoadPercent: Math.round(load.currentLoad),
    cpuTempC: typeof temp.main === 'number' && temp.main > 0 ? Math.round(temp.main) : null,
    ramUsedGB: round2(mem.active / 1024 ** 3),
    ramTotalGB: round2(mem.total / 1024 ** 3),
    ramPercent: Math.round((mem.active / mem.total) * 100),
    gpuName: gpu?.model ?? null,
    gpuLoadPercent: typeof gpuLoadRaw === 'number' ? Math.round(gpuLoadRaw) : null,
    gpuTempC: typeof gpu?.temperatureGpu === 'number' ? Math.round(gpu.temperatureGpu) : null,
    uptimeSeconds: time.uptime
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getProcessCount(): Promise<number> {
  const procs = await si.processes();
  return procs.all;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const [wifi, iface] = await Promise.all([
    si.wifiConnections().catch(() => []),
    si.networkInterfaceDefault().catch(() => '')
  ]);

  const conn = wifi[0];
  const ping = await pingHost('8.8.8.8').catch(() => null);

  return {
    ssid: conn?.ssid ?? null,
    signalPercent: typeof conn?.quality === 'number' ? conn.quality : null,
    interfaceType: iface || 'desconocida',
    pingMs: ping
  };
}

async function pingHost(host: string): Promise<number | null> {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? `ping -n 1 -w 1500 ${host}` : `ping -c 1 -W 1 ${host}`;
  try {
    const { stdout } = await execAsync(cmd);
    const match = isWindows
      ? stdout.match(/tiempo[=<]([\d.]+)ms|time[=<]([\d.]+)ms/i)
      : stdout.match(/time[=<]([\d.]+) ms/i);
    const value = match ? Number(match[1] ?? match[2]) : null;
    return value !== null && !Number.isNaN(value) ? value : null;
  } catch {
    return null;
  }
}
