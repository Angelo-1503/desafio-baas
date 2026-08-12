import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

export function ActivateGatewayPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.activateGateway(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao ativar conta do gateway');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <div className="card stack">
          <h1>Conta do gateway ativada!</h1>
          <p>
            Sua integração com o gateway Lera Box está pronta. Os webhooks de Pix, cartão e saque já
            foram registrados automaticamente.
          </p>
          <button type="button" onClick={() => navigate('/dashboard')}>
            Ir para a carteira
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h1>Ativar conta do gateway</h1>
      <p className="muted">
        Verifique seu e-mail — o gateway Lera Box enviou uma senha de acesso após o cadastro. Cole
        essa senha abaixo para concluir a integração.
      </p>
      <form className="stack card" onSubmit={handleSubmit}>
        {error && <div className="error-box">{error}</div>}
        <label className="stack" style={{ gap: '0.3rem' }}>
          Senha recebida por e-mail
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Ativando...' : 'Ativar'}
        </button>
      </form>
    </div>
  );
}
