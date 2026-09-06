import { useEffect, useState } from 'react';
import type { OptimizationKey, OptimizationSettings } from '../../../electron/shared/types';

const TOGGLES: { key: OptimizationKey; label: string; desc: string; danger?: boolean }[] = [
  {
    key: 'powerPlan',
    label: 'Plan de energía en Alto rendimiento',
    desc: 'Cambia el plan de energía de Windows mientras juegas y lo restaura al salir.'
  },
  {
    key: 'windowsSearch',
    label: 'Pausar indexado de Windows Search',
    desc: 'Detiene temporalmente el servicio de indexado de archivos.'
  },
  {
    key: 'windowsUpdate',
    label: 'Pausar Windows Update',
    desc: 'Evita descargas de actualizaciones mientras juegas.'
  },
  {
    key: 'defenderScheduledScan',
    label: 'Pausar análisis programado de Defender',
    desc: 'La protección en tiempo real sigue activa; solo se pausa el análisis programado.'
  },
  {
    key: 'backgroundAppsPriority',
    label: 'Bajar prioridad de apps en segundo plano',
    desc: 'Reduce la prioridad de procesos de la lista de abajo (no los cierra).'
  },
  {
    key: 'closeSelectedApps',
    label: 'Cerrar apps marcadas manualmente',
    desc: 'Cierra por completo las apps que añadas a la lista de "cerrar durante el juego".'
  },
  {
    key: 'gamePriorityBoost',
    label: 'Prioridad alta para el juego detectado',
    desc: 'Da más prioridad de CPU al proceso del juego mientras esté activo el Modo Turbo.'
  },
  {
    key: 'defenderRealtime',
    label: 'Pausar protección en tiempo real de Defender',
    desc: 'Avanzado: desactiva temporalmente el antivirus en tiempo real. Deja tu PC más expuesto mientras está activo. Se reactiva solo al salir del Modo Turbo.',
    danger: true
  }
];

export default function SettingsTab() {
  const [settings, setSettings] = useState<OptimizationSettings | null>(null);
  const [newCloseApp, setNewCloseApp] = useState('');
  const [newLowerApp, setNewLowerApp] = useState('');
  const [confirmDanger, setConfirmDanger] = useState(false);

  useEffect(() => {
    window.nitroboost.settings.get().then(setSettings);
  }, []);

  async function persist(next: OptimizationSettings) {
    setSettings(next);
    await window.nitroboost.settings.update(next);
  }

  function toggle(key: OptimizationKey, value: boolean) {
    if (!settings) return;
    if (key === 'defenderRealtime' && value && !confirmDanger) {
      const ok = window.confirm(
        '¿Seguro que quieres permitir que NitroBoost pause la protección en tiempo real del antivirus mientras juegas? Tu PC quedará más expuesto durante ese tiempo.'
      );
      if (!ok) return;
      setConfirmDanger(true);
    }
    void persist({ ...settings, enabled: { ...settings.enabled, [key]: value } });
  }

  function addToList(list: 'closeAppsList' | 'priorityLowerList', value: string) {
    if (!settings || !value.trim()) return;
    const exe = value.trim().toLowerCase().endsWith('.exe') ? value.trim() : `${value.trim()}.exe`;
    if (settings[list].includes(exe)) return;
    void persist({ ...settings, [list]: [...settings[list], exe] });
  }

  function removeFromList(list: 'closeAppsList' | 'priorityLowerList', value: string) {
    if (!settings) return;
    void persist({ ...settings, [list]: settings[list].filter((v) => v !== value) });
  }

  if (!settings) return <div className="tab-page">Cargando ajustes…</div>;

  return (
    <div className="tab-page">
      <h1>Ajustes</h1>
      <p className="tab-subtitle">Elige qué optimizaciones aplica NitroBoost durante el Modo Turbo.</p>

      <div className="panel">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.autoDetectGames}
            onChange={(e) => void persist({ ...settings, autoDetectGames: e.target.checked })}
          />
          <div>
            <div className="opt-label">Detección automática de juegos</div>
            <div className="opt-detail">Activa el Modo Turbo solo mientras juegas, sin intervención.</div>
          </div>
        </label>
      </div>

      <div className="panel">
        {TOGGLES.map((t) => (
          <label className={`switch-row ${t.danger ? 'danger' : ''}`} key={t.key}>
            <input
              type="checkbox"
              checked={settings.enabled[t.key]}
              onChange={(e) => toggle(t.key, e.target.checked)}
            />
            <div>
              <div className="opt-label">{t.label}</div>
              <div className="opt-detail">{t.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="panel">
        <h3>Apps a las que bajar prioridad durante el juego</h3>
        <div className="chip-row">
          {settings.priorityLowerList.map((exe) => (
            <span className="chip" key={exe}>
              {exe}
              <button onClick={() => removeFromList('priorityLowerList', exe)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-row">
          <input
            placeholder="nombre.exe"
            value={newLowerApp}
            onChange={(e) => setNewLowerApp(e.target.value)}
          />
          <button
            className="btn btn-ghost"
            onClick={() => {
              addToList('priorityLowerList', newLowerApp);
              setNewLowerApp('');
            }}
          >
            Añadir
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Apps a cerrar por completo durante el juego</h3>
        <div className="chip-row">
          {settings.closeAppsList.map((exe) => (
            <span className="chip" key={exe}>
              {exe}
              <button onClick={() => removeFromList('closeAppsList', exe)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-row">
          <input
            placeholder="nombre.exe"
            value={newCloseApp}
            onChange={(e) => setNewCloseApp(e.target.value)}
          />
          <button
            className="btn btn-ghost"
            onClick={() => {
              addToList('closeAppsList', newCloseApp);
              setNewCloseApp('');
            }}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
