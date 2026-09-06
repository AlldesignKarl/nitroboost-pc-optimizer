import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import type { SystemSnapshot } from '../../../electron/shared/types';

function tempTone(temp: number | null): 'default' | 'warn' | 'danger' {
  if (temp === null) return 'default';
  if (temp >= 85) return 'danger';
  if (temp >= 70) return 'warn';
  return 'default';
}

export default function Overview() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [processCount, setProcessCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = window.nitroboost.system.onSnapshot(setSnapshot);
    window.nitroboost.system.getProcessCount().then(setProcessCount);
    const interval = setInterval(() => {
      window.nitroboost.system.getProcessCount().then(setProcessCount);
    }, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="tab-page">
      <h1>Resumen del sistema</h1>
      <p className="tab-subtitle">Datos en vivo de tu equipo, actualizados cada pocos segundos.</p>

      <div className="stat-grid">
        <StatCard
          label="CPU"
          value={snapshot ? `${snapshot.cpuLoadPercent}%` : '—'}
          sub="Uso actual"
        />
        <StatCard
          label="Temperatura CPU"
          value={snapshot?.cpuTempC != null ? `${snapshot.cpuTempC}°C` : 'N/D'}
          sub={snapshot?.cpuTempC == null ? 'Sensor no disponible en este equipo' : undefined}
          tone={tempTone(snapshot?.cpuTempC ?? null)}
        />
        <StatCard
          label="RAM"
          value={snapshot ? `${snapshot.ramPercent}%` : '—'}
          sub={snapshot ? `${snapshot.ramUsedGB} GB / ${snapshot.ramTotalGB} GB` : undefined}
        />
        <StatCard
          label="GPU"
          value={snapshot?.gpuLoadPercent != null ? `${snapshot.gpuLoadPercent}%` : 'N/D'}
          sub={snapshot?.gpuName ?? undefined}
        />
        <StatCard
          label="Temperatura GPU"
          value={snapshot?.gpuTempC != null ? `${snapshot.gpuTempC}°C` : 'N/D'}
          tone={tempTone(snapshot?.gpuTempC ?? null)}
        />
        <StatCard
          label="Procesos activos"
          value={processCount != null ? String(processCount) : '—'}
        />
        <StatCard
          label="Tiempo encendido"
          value={snapshot ? formatUptime(snapshot.uptimeSeconds) : '—'}
        />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}
