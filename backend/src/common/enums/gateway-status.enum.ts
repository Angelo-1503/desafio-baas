/** Espelha o enum de status usado pelo gateway Lera Box em pagamentos, saques e extrato. */
export enum GatewayStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
