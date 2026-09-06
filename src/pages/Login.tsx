import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.nitroboost.auth.hasAccount().then(setHasAccount);
  }, []);

  const isRegisterMode = hasAccount === false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = isRegisterMode
        ? await window.nitroboost.auth.register(username, password)
        : await window.nitroboost.auth.login(username, password);

      if (!result.ok || !result.user) {
        setError(result.error ?? 'No se pudo iniciar sesión.');
        return;
      }
      login(result.user);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <div className="brand">
          <span className="brand-dot" />
          NitroBoost
        </div>
        <h2>{isRegisterMode ? 'Crea tu cuenta local' : 'Iniciar sesión'}</h2>
        <p className="hint">
          {isRegisterMode
            ? 'Es la primera vez que abres NitroBoost en este PC. Esta cuenta se guarda solo en tu equipo.'
            : 'Accede con tu cuenta local para ver tu panel de rendimiento.'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              minLength={3}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading || hasAccount === null}>
            {loading ? 'Comprobando…' : isRegisterMode ? 'Crear cuenta y entrar' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
