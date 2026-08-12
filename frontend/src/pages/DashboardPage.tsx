import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import type { GatewayStatus, WalletTransaction } from '../api/types';
import type { TransactionFilters } from '../api/wallet';
import { walletApi } from '../api/wallet';
import { StatusBadge } from '../components/StatusBadge';
import { centavosToBRL } from '../utils/money';

const STATUS_OPTIONS: { value: GatewayStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'APPROVED', label: 'Sucesso' },
  { value: 'DENIED', label: 'Falha' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const TYPE_OPTIONS: { value: TransactionFilters['type'] | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão' },
  { value: 'WITHDRAWAL', label: 'Saque' },
];

export function DashboardPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [status, setStatus] = useState<GatewayStatus | ''>('');
  const [type, setType] = useState<TransactionFilters['type'] | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({
          status: status || undefined,
          type: type || undefined,
          limit: 50,
        }),
      ]);
      setBalance(balanceRes.balance);
      setTransactions(txRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar carteira');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is redefined each render but only needs status/type as triggers
  useEffect(() => {
    load();
  }, [status, type]);

  return (
    <div className="stack">
      <h1>Carteira</h1>

      <div className="card">
        <p className="muted">Saldo disponível</p>
        <h2 style={{ margin: 0 }}>{balance !== null ? centavosToBRL(balance) : '—'}</h2>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card stack">
        <div className="row">
          <h3 style={{ margin: 0, flex: '1 1 140px' }}>Extrato</h3>
          <select
            className="select-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as GatewayStatus | '')}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="select-filter"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionFilters['type'] | '')}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="muted">Carregando...</p>
        ) : transactions.length === 0 ? (
          <p className="muted">Nenhuma transação encontrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Referência</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.type}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td>{centavosToBRL(tx.amount)}</td>
                  <td className="muted">{tx.externalReference ?? '—'}</td>
                  <td className="muted">{new Date(tx.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
