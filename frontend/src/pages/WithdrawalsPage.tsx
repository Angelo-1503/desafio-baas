import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import type { Withdrawal } from '../api/types';
import { withdrawalsApi } from '../api/withdrawals';
import { StatusBadge } from '../components/StatusBadge';
import { brlToCentavos, centavosToBRL } from '../utils/money';

export function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [document, setDocument] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setWithdrawals(await withdrawalsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar saques');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load only needs to run once on mount
  useEffect(() => {
    load();
  }, []);

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    setError(null);
    try {
      const fresh = await withdrawalsApi.get(id);
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? fresh : w)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao consultar status');
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await withdrawalsApi.create({
        amountCents: brlToCentavos(amount),
        pixKey,
        document,
        description: description || undefined,
      });
      setAmount('');
      setPixKey('');
      setDocument('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao solicitar saque');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack">
      <h1>Saques</h1>

      <form className="card stack" onSubmit={handleSubmit}>
        <h3 style={{ margin: 0 }}>Solicitar saque</h3>
        {error && <div className="error-box">{error}</div>}
        <div className="row">
          <label className="field">
            Valor (R$)
            <input required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field">
            Chave Pix de destino
            <input required value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
          </label>
          <label className="field">
            CPF do titular
            <input required value={document} onChange={(e) => setDocument(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Descrição (opcional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" disabled={creating}>
          {creating ? 'Solicitando...' : 'Solicitar saque'}
        </button>
      </form>

      <div className="card stack">
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : withdrawals.length === 0 ? (
          <p className="muted">Nenhum saque solicitado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Valor</th>
                <th>Chave Pix</th>
                <th>Status</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{centavosToBRL(w.amountCents)}</td>
                  <td className="muted">{w.pixKey}</td>
                  <td>
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="muted">{new Date(w.createdAt).toLocaleString('pt-BR')}</td>
                  <td>
                    {w.status === 'PENDING' && (
                      <button
                        type="button"
                        className="secondary"
                        disabled={refreshingId === w.id}
                        onClick={() => handleRefresh(w.id)}
                      >
                        {refreshingId === w.id ? 'Consultando...' : 'Atualizar status'}
                      </button>
                    )}
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
