import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { webhooksApi } from '../api/misc';
import type { WebhookRegistered } from '../api/types';

export function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRegistered[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    webhooksApi
      .listRegistered()
      .then(setWebhooks)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Falha ao carregar'))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load only needs to run once on mount
  useEffect(() => {
    load();
  }, []);

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await webhooksApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao remover webhook');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="stack">
      <h1>Webhooks</h1>
      <p className="muted">
        Registrados automaticamente no gateway Lera Box quando você ativou sua conta. Eles recebem
        os eventos de Pix, cartão e saque e atualizam seus pedidos automaticamente.
      </p>
      {error && <div className="error-box">{error}</div>}
      <div className="card stack">
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : webhooks.length === 0 ? (
          <p className="muted">Nenhum webhook registrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>URL</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh) => (
                <tr key={wh.id}>
                  <td>{wh.event}</td>
                  <td className="muted">{wh.url}</td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      disabled={removingId === wh.id}
                      onClick={() => handleRemove(wh.id)}
                    >
                      {removingId === wh.id ? 'Removendo...' : 'Remover'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
