import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { checkoutApi } from '../api/checkout';
import { ApiError } from '../api/client';
import type { CheckoutLink, Order } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { centavosToBRL } from '../utils/money';

export function CheckoutLinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<CheckoutLink | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setError(null);
    try {
      const [linkRes, ordersRes] = await Promise.all([
        checkoutApi.get(id),
        checkoutApi.listOrders(id),
      ]);
      setLink(linkRes);
      setOrders(ordersRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar link');
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is redefined each render but only needs id as trigger
  useEffect(() => {
    load();
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    try {
      await checkoutApi.cancel(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao cancelar link');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSending(true);
    setSentMessage(null);
    setError(null);
    try {
      const result = await checkoutApi.sendByEmail(id, email);
      setSentMessage(
        result.sent ? 'Link enviado por e-mail!' : 'SMTP não configurado no servidor.',
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao enviar e-mail');
    } finally {
      setSending(false);
    }
  }

  if (!link) return <p className="muted">Carregando...</p>;

  const payUrl = `${window.location.origin}/pay/${link.id}`;

  return (
    <div className="stack">
      <Link to="/checkout-links" className="muted">
        &larr; Voltar
      </Link>
      <h1>Link de pagamento</h1>
      {error && <div className="error-box">{error}</div>}

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0, flex: 1 }}>{centavosToBRL(link.amountCents)}</h2>
          <StatusBadge status={link.status} />
        </div>
        <p className="muted">{link.description ?? 'Sem descrição'}</p>
        <p className="muted">Métodos aceitos: {link.allowedMethods.join(' / ')}</p>
        {link.cardBrand && (
          <p className="muted">
            Cartão: {link.cardBrand} em {link.cardInstallments}x (taxa {link.cardFeePercent}%)
          </p>
        )}
        <p className="muted">Expira em: {new Date(link.expiresAt).toLocaleString('pt-BR')}</p>

        <label className="stack" style={{ gap: '0.3rem' }}>
          URL de pagamento
          <input readOnly value={payUrl} onFocus={(e) => e.target.select()} />
        </label>

        <div className="row">
          {link.status === 'ACTIVE' && (
            <button type="button" className="danger" onClick={handleCancel}>
              Cancelar link
            </button>
          )}
          <a href={payUrl} target="_blank" rel="noreferrer">
            Abrir página de pagamento
          </a>
        </div>
      </div>

      <form className="card stack" onSubmit={handleSend}>
        <h3 style={{ margin: 0 }}>Enviar por e-mail</h3>
        {sentMessage && <p className="muted">{sentMessage}</p>}
        <div className="row">
          <input
            type="email"
            required
            placeholder="pagador@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <button type="submit" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>Tentativas de pagamento</h3>
        {orders.length === 0 ? (
          <p className="muted">Nenhuma tentativa ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Método</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Referência</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.method}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{centavosToBRL(order.amountCents)}</td>
                  <td className="muted">{order.externalReference}</td>
                  <td className="muted">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                  <td>
                    {order.status === 'APPROVED' && (
                      <Link to={`/receipt/${order.id}`}>Comprovante</Link>
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
