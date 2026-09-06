import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Modo Turbo automático',
    desc: 'Detecta cuándo abres un juego y libera recursos del sistema al instante, sin que tengas que hacer nada.'
  },
  {
    title: 'Monitor en tiempo real',
    desc: 'CPU, RAM, GPU, temperaturas y velocidad de tu red, siempre visibles en un panel claro.'
  },
  {
    title: 'Optimización segura y reversible',
    desc: 'Pausa tareas en segundo plano (indexado, actualizaciones, análisis programados) y lo restaura todo al salir del juego.'
  },
  {
    title: 'Historial local',
    desc: 'Guarda cada sesión de juego y test de velocidad en tu propio equipo, sin subir nada a la nube.'
  }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <header className="home-hero">
        <div className="brand">
          <span className="brand-dot" />
          NitroBoost
        </div>
        <h1>Tu PC, al máximo rendimiento cuando más importa.</h1>
        <p className="subtitle">
          NitroBoost vigila tu equipo en segundo plano y activa un Modo Turbo en cuanto detecta un juego:
          libera CPU y RAM, pausa procesos no esenciales y lo revierte todo automáticamente al terminar.
        </p>
        <div className="cta-row">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Empezar ahora
          </button>
        </div>
      </header>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        <p>
          Requiere Windows y permisos de administrador para aplicar las optimizaciones del sistema.
          Ninguna optimización se aplica sin tu confirmación en Ajustes.
        </p>
      </footer>
    </div>
  );
}
