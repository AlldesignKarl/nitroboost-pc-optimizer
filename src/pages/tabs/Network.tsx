import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import type { NetworkStatus, SpeedTestResult } from '../../../electron/shared/types';

export default function NetworkTab() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [speed, setSpeed] = useState<SpeedTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus();
  }, []);

  function refreshStatus() {
    window.nitroboost.network.getStatus().then(setStatus);
  }

  async function handleSpeedTest() {
    setTesting(true);
    setTestError(null);
    try {
      const result = await window.nitroboost.network.runSpeedTest();
      setSpeed(result);
    } catch (err) {
      setTestError('No se pudo completar el test. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="tab-page">
      <h1>Red</h1>
      <p className="tab-subtitle">Estado de tu conexión y velocidad de descarga.</p>

      <div className="stat-grid">
        <StatCard label="Red WiFi" value={status?.ssid ?? 'No conectado por WiFi'} />
        <StatCard
          label="Señal"
          value={status?.signalPercent != null ? `${status.signalPercent}%` : 'N/D'}
        />
        <StatCard label="Ping" value={status?.pingMs != null ? `${status.pingMs} ms` : 'N/D'} />
        <StatCard
          label="Velocidad de descarga"
          value={speed ? `${speed.downloadMbps} Mbps` : 'Sin medir'}
        />
      </div>

      <div className="panel">
        <button className="btn btn-primary" onClick={handleSpeedTest} disabled={testing}>
          {testing ? 'Midiendo velocidad…' : 'Ejecutar test de velocidad'}
        </button>
        <button className="btn btn-ghost" onClick={refreshStatus} style={{ marginLeft: 12 }}>
          Actualizar estado
        </button>
        {testError && <div className="error-box" style={{ marginTop: 16 }}>{testError}</div>}
      </div>
    </div>
  );
}
