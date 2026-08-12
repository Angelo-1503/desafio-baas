import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Sinaliza 401 do gateway para o retry interno de `GatewayAccountService.withAuth`.
 * Se o retry falhar de novo, vira uma resposta 502 para quem chamou a nossa API —
 * do ponto de vista do cliente da BaaS, é uma falha de integração, não dele.
 */
export class GatewayUnauthorizedError extends HttpException {
  constructor() {
    super('Não foi possível reautenticar com o gateway Lera Box', HttpStatus.BAD_GATEWAY);
    this.name = 'GatewayUnauthorizedError';
  }
}

/**
 * Erro de negócio retornado pelo gateway (ex: documento duplicado, feePercent divergente).
 * Repassamos o status 4xx original quando fizer sentido; erros 5xx/rede do gateway
 * viram 502 (Bad Gateway), já que a falha é da integração, não do requisitante.
 */
export class GatewayRequestError extends HttpException {
  constructor(
    public readonly gatewayStatus: number,
    message: string,
    public readonly details?: unknown,
  ) {
    const exposedStatus =
      gatewayStatus >= 400 && gatewayStatus < 500 ? gatewayStatus : HttpStatus.BAD_GATEWAY;
    super(message, exposedStatus);
    this.name = 'GatewayRequestError';
  }
}
