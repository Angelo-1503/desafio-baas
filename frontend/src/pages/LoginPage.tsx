import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 380 }}>
      <h1>Entrar</h1>
      <form className="stack card" onSubmit={handleSubmit}>
        {error && <div className="error-box">{error}</div>}
        <label className="stack" style={{ gap: '0.3rem' }}>
          E-mail
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: '0.3rem' }}>
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="muted">
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
