import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicCheckoutApi } from '../api/checkout';
import { ApiError } from '../api/client';
import type { CheckoutLink, Order } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { centavosToBRL } from '../utils/money';

type Method = 'PIX' | 'CARD';

export function PayPage() {
  const { linkId } = useParams<{ linkId: string }>();
  const [link, setLink] = useState<CheckoutLink | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkId) return;
    publicCheckoutApi
      .getLink(linkId)
      .then(setLink)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Link não encontrado'));
  }, [linkId]);

  if (loadError) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <div className="error-box">{loadError}</div>
      </div>
    );
  }

  if (!link)
    return (
      <p className="muted" style={{ padding: '2rem' }}>
        Carregando...
      </p>
    );

  if (link.status !== 'ACTIVE') {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <div className="card stack">
          <h1>Link indisponível</h1>
          <p>
            Este link está <StatusBadge status={link.status} /> e não pode mais receber pagamentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <div className="card stack">
        <h1 style={{ margin: 0 }}>{centavosToBRL(link.amountCents)}</h1>
        <p className="muted">{link.description ?? 'Pagamento'}</p>

        {error && <div className="error-box">{error}</div>}

        {!method && (
          <div className="row">
            {link.allowedMethods.includes('PIX') && (
              <button type="button" onClick={() => setMethod('PIX')}>
                Pagar com Pix
              </button>
            )}
            {link.allowedMethods.includes('CARD') && (
              <button type="button" className="secondary" onClick={() => setMethod('CARD')}>
                Pagar com cartão
              </button>
            )}
          </div>
        )}

        {method === 'PIX' && linkId && <PixPayment linkId={linkId} onError={setError} />}
        {method === 'CARD' && linkId && (
          <CardPayment linkId={linkId} link={link} onError={setError} />
        )}
      </div>
    </div>
  );
}

function OrderResult({ linkId, order }: { linkId: string; order: Order }) {
  const [current, setCurrent] = useState(order);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (current.status !== 'PENDING') return;
    pollRef.current = setInterval(async () => {
      const fresh = await publicCheckoutApi.getOrder(linkId, order.id);
      setCurrent(fresh);
      if (fresh.status !== 'PENDING') clearInterval(pollRef.current);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [current.status, linkId, order.id]);

  return (
    <div className="stack">
      <div className="row">
        <span>Status:</span>
        <StatusBadge status={current.status} />
      </div>
      {current.status === 'PENDING' && (
        <p className="muted">Aguardando confirmação do pagamento...</p>
      )}
      {current.status === 'APPROVED' && <a href={`/receipt/${current.id}`}>Ver comprovante</a>}
    </div>
  );
}

function PixPayment({ linkId, onError }: { linkId: string; onError: (msg: string) => void }) {
  const [payerDocument, setPayerDocument] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError('');
    try {
      const result = await publicCheckoutApi.payWithPix(linkId, payerDocument);
      setOrder(result);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Falha ao gerar cobrança Pix');
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <div className="stack">
        {order.qrCodeBase64 && (
          <img
            src={`data:image/png;base64,${order.qrCodeBase64}`}
            alt="QR Code Pix"
            style={{ width: '100%', maxWidth: 260, alignSelf: 'center' }}
          />
        )}
        {order.emv && (
          <label className="stack" style={{ gap: '0.3rem' }}>
            Pix copia e cola
            <textarea readOnly value={order.emv} rows={3} onFocus={(e) => e.target.select()} />
          </label>
        )}
        <OrderResult linkId={linkId} order={order} />
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={handleGenerate}>
      <label className="stack" style={{ gap: '0.3rem' }}>
        CPF/CNPJ do pagador
        <input
          required
          value={payerDocument}
          onChange={(e) => setPayerDocument(e.target.value)}
          placeholder="somente números"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Gerando...' : 'Gerar QR Code Pix'}
      </button>
    </form>
  );
}

function CardPayment({
  linkId,
  link,
  onError,
}: {
  linkId: string;
  link: CheckoutLink;
  onError: (msg: string) => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError('');
    try {
      const result = await publicCheckoutApi.payWithCard(linkId, {
        cardNumber,
        cardHolder,
        expiryMonth,
        expiryYear,
        cvv,
      });
      setOrder(result);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Falha ao processar pagamento');
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return <OrderResult linkId={linkId} order={order} />;
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <p className="muted">
        {link.cardBrand} em {link.cardInstallments}x — taxa de {link.cardFeePercent}% definida pelo
        lojista
      </p>

      <label className="field">
        Número do cartão
        <input
          required
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4111111111111111"
        />
      </label>
      <label className="field">
        Nome impresso no cartão
        <input required value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
      </label>
      <div className="row">
        <label className="field field-sm">
          Mês
          <input
            required
            placeholder="12"
            maxLength={2}
            value={expiryMonth}
            onChange={(e) => setExpiryMonth(e.target.value)}
          />
        </label>
        <label className="field field-sm">
          Ano
          <input
            required
            placeholder="2030"
            maxLength={4}
            value={expiryYear}
            onChange={(e) => setExpiryYear(e.target.value)}
          />
        </label>
        <label className="field field-sm">
          CVV
          <input required maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value)} />
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Processando...' : 'Pagar'}
      </button>
    </form>
  );
}
