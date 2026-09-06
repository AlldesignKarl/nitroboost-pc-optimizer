import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Overview from './tabs/Overview';
import NetworkTab from './tabs/Network';
import GameModeTab from './tabs/GameMode';
import HistoryTab from './tabs/History';
import SettingsTab from './tabs/Settings';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Resumen', end: true },
  { to: '/dashboard/red', label: 'Red' },
  { to: '/dashboard/modo-juego', label: 'Modo Juego' },
  { to: '/dashboard/historial', label: 'Historial' },
  { to: '/dashboard/ajustes', label: 'Ajustes' }
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          NitroBoost
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">{user?.username}</div>
          <button className="btn btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="red" element={<NetworkTab />} />
          <Route path="modo-juego" element={<GameModeTab />} />
          <Route path="historial" element={<HistoryTab />} />
          <Route path="ajustes" element={<SettingsTab />} />
        </Routes>
      </main>
    </div>
  );
}
