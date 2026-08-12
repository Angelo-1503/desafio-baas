import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pdfUrl } from '../api/client';
import { receiptsApi } from '../api/misc';
import type { ReceiptData } from '../api/types';

export function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    receiptsApi
      .get(orderId)
      .then(setData)
      .catch(() => setError('Comprovante não disponível'));
  }, [orderId]);

  if (error) {
    return (
      <div className="page" style={{ maxWidth: 420 }}>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!data)
    return (
      <p className="muted" style={{ padding: '2rem' }}>
        Carregando...
      </p>
    );

  const { order, checkoutLink, formattedAmount, formattedNetAmount } = data;

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="card stack">
        <h1 style={{ margin: 0 }}>Comprovante de pagamento</h1>
        <p className="muted">VBA Systems BaaS · Gateway Lera Box</p>

        <dl className="stack" style={{ gap: '0.4rem' }}>
          <Row label="Status" value={order.status} />
          <Row label="Valor" value={formattedAmount} />
          {formattedNetAmount && <Row label="Valor líquido" value={formattedNetAmount} />}
          <Row label="Método" value={order.method} />
          {order.brand && <Row label="Bandeira" value={order.brand} />}
          {order.installments && <Row label="Parcelas" value={`${order.installments}x`} />}
          {order.cardLast4 && <Row label="Cartão" value={`**** ${order.cardLast4}`} />}
          {order.payerDocument && <Row label="Documento do pagador" value={order.payerDocument} />}
          <Row label="Referência" value={order.externalReference} />
          {checkoutLink?.description && <Row label="Descrição" value={checkoutLink.description} />}
          <Row label="Data" value={new Date(order.updatedAt).toLocaleString('pt-BR')} />
        </dl>

        <div className="row" style={{ printColorAdjust: 'exact' } as React.CSSProperties}>
          <button type="button" onClick={() => window.print()}>
            Imprimir
          </button>
          <a href={pdfUrl(`/public/receipts/${order.id}/pdf`)} target="_blank" rel="noreferrer">
            Baixar PDF
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <dt className="muted">{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
