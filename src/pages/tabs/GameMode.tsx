import { useEffect, useState } from 'react';
import type { GameModeState } from '../../../electron/shared/types';

export default function GameModeTab() {
  const [state, setState] = useState<GameModeState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.nitroboost.gameMode.getState().then(setState);
    const unsubscribe = window.nitroboost.gameMode.onStateChanged(setState);
    return unsubscribe;
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      const next = await window.nitroboost.gameMode.setManual(!state?.active);
      setState(next);
    } finally {
      setBusy(false);
    }
  }

  const active = state?.active ?? false;

  return (
    <div className="tab-page">
      <h1>Modo Juego</h1>
      <p className="tab-subtitle">
        NitroBoost detecta automáticamente cuándo abres un juego conocido o entras en pantalla
        completa, y activa el Modo Turbo por ti. También puedes activarlo manualmente aquí.
      </p>

      <div className={`gamemode-banner ${active ? 'active' : ''}`}>
        <div>
          <div className="gamemode-status">{active ? 'Modo Turbo ACTIVO' : 'Modo Turbo apagado'}</div>
          {active && state?.gameName && <div className="gamemode-game">Juego detectado: {state.gameName}</div>}
          {active && state?.reason === 'manual' && <div className="gamemode-game">Activado manualmente</div>}
        </div>
        <button className="btn btn-primary" onClick={toggle} disabled={busy}>
          {active ? 'Desactivar ahora' : 'Activar ahora'}
        </button>
      </div>

      {active && state && state.applied.length > 0 && (
        <div className="panel">
          <h3>Optimizaciones aplicadas</h3>
          <ul className="optimization-list">
            {state.applied.map((opt) => (
              <li key={opt.key} className={opt.success ? 'ok' : 'fail'}>
                <span className="dot" />
                <div>
                  <div className="opt-label">{opt.label}</div>
                  <div className="opt-detail">{opt.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel muted">
        <p>
          Puedes elegir qué optimizaciones se aplican y qué apps se cierran o bajan de prioridad en la
          pestaña <strong>Ajustes</strong>. La protección en tiempo real del antivirus solo se pausa si
          la activas explícitamente ahí, y se restaura automáticamente al salir del Modo Turbo (o tras
          un máximo de 6 horas por seguridad).
        </p>
      </div>
    </div>
  );
}
