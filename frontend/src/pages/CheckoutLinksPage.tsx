import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkoutApi } from '../api/checkout';
import { ApiError } from '../api/client';
import { feesApi } from '../api/misc';
import type { CardBrand, CheckoutLink, FeeRow, PaymentMethod } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { brlToCentavos, centavosToBRL } from '../utils/money';

export function CheckoutLinksPage() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [methods, setMethods] = useState<PaymentMethod[]>(['PIX', 'CARD']);
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [cardBrand, setCardBrand] = useState<CardBrand>('VISA');
  const [cardFees, setCardFees] = useState<FeeRow[]>([]);
  const [cardInstallments, setCardInstallments] = useState(1);
  const [creating, setCreating] = useState(false);

  const cardEnabled = methods.includes('CARD');
  const selectedCardFee = cardFees.find((f) => f.installments === cardInstallments);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setLinks(await checkoutApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar links');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load only needs to run once on mount
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (cardEnabled) feesApi.list(cardBrand).then(setCardFees);
  }, [cardEnabled, cardBrand]);

  function toggleMethod(method: PaymentMethod) {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (methods.length === 0) {
      setError('Selecione ao menos um método de pagamento');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await checkoutApi.create({
        amountCents: brlToCentavos(amount),
        description: description || undefined,
        allowedMethods: methods,
        expiresInMinutes,
        cardBrand: cardEnabled ? cardBrand : undefined,
        cardInstallments: cardEnabled ? cardInstallments : undefined,
      });
      setAmount('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao criar link');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack">
      <h1>Links de pagamento</h1>

      <form className="card stack" onSubmit={handleCreate}>
        <h3 style={{ margin: 0 }}>Novo link</h3>
        {error && <div className="error-box">{error}</div>}
        <div className="row">
          <label className="field">
            Valor (R$)
            <input
              required
              placeholder="150,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="field field-lg">
            Descrição
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field">
            Expira em (min)
            <input
              type="number"
              min={5}
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="row">
          <label className="row" style={{ gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={methods.includes('PIX')}
              onChange={() => toggleMethod('PIX')}
            />
            Pix
          </label>
          <label className="row" style={{ gap: '0.4rem' }}>
            <input type="checkbox" checked={cardEnabled} onChange={() => toggleMethod('CARD')} />
            Cartão
          </label>
        </div>

        {cardEnabled && (
          <div className="row">
            <label className="field">
              Bandeira
              <select value={cardBrand} onChange={(e) => setCardBrand(e.target.value as CardBrand)}>
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="ELO">Elo</option>
              </select>
            </label>
            <label className="field">
              Parcelas
              <select
                value={cardInstallments}
                onChange={(e) => setCardInstallments(Number(e.target.value))}
              >
                {cardFees.map((f) => (
                  <option key={f.installments} value={f.installments}>
                    {f.installments}x ({f.feePercentFormatted ?? `${f.feePercent}%`})
                  </option>
                ))}
              </select>
            </label>
            {selectedCardFee && (
              <p className="muted" style={{ flex: '1 1 160px' }}>
                Taxa travada neste link:{' '}
                {selectedCardFee.feePercentFormatted ?? `${selectedCardFee.feePercent}%`}
              </p>
            )}
          </div>
        )}

        <button type="submit" disabled={creating}>
          {creating ? 'Criando...' : 'Criar link'}
        </button>
      </form>

      <div className="card stack">
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : links.length === 0 ? (
          <p className="muted">Nenhum link criado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Valor</th>
                <th>Descrição</th>
                <th>Métodos</th>
                <th>Status</th>
                <th>Expira em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>{centavosToBRL(link.amountCents)}</td>
                  <td className="muted">{link.description ?? '—'}</td>
                  <td className="muted">{link.allowedMethods.join(' / ')}</td>
                  <td>
                    <StatusBadge status={link.status} />
                  </td>
                  <td className="muted">{new Date(link.expiresAt).toLocaleString('pt-BR')}</td>
                  <td>
                    <Link to={`/checkout-links/${link.id}`}>Detalhes</Link>
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
