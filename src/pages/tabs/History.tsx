import { useEffect, useState } from 'react';
import type { HistoryEntry } from '../../../electron/shared/types';

export default function HistoryTab() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    window.nitroboost.history.list().then(setEntries);
  }

  async function handleClear() {
    await window.nitroboost.history.clear();
    refresh();
  }

  return (
    <div className="tab-page">
      <h1>Historial</h1>
      <p className="tab-subtitle">
        Sesiones de Modo Turbo y tests de velocidad guardados localmente en este equipo.
      </p>

      <div className="panel">
        <button className="btn btn-ghost" onClick={handleClear} disabled={entries.length === 0}>
          Borrar historial
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="tab-subtitle">Todavía no hay actividad registrada.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.title}</td>
                <td>{entry.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
