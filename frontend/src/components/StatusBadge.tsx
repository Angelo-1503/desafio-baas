const LABELS: Record<string, string> = {
  APPROVED: 'Sucesso',
  DENIED: 'Falha',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  PAID: 'Pago',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status.toLowerCase()}`}>{LABELS[status] ?? status}</span>;
}
