import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Transporter, createTransport } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    this.from = this.configService.get<string>('SMTP_FROM') ?? 'no-reply@baas-vba.local';

    if (!host) {
      this.logger.warn(
        'SMTP não configurado (SMTP_HOST ausente) — envio de e-mail ficará desabilitado',
      );
      return;
    }

    this.transporter = createTransport({
      host,
      port: this.configService.get<number>('SMTP_PORT', 587),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  get isConfigured(): boolean {
    return Boolean(this.transporter);
  }

  async sendCheckoutLink(
    to: string,
    params: { amountLabel: string; description?: string; url: string },
  ) {
    if (!this.transporter) {
      this.logger.warn(`Envio de e-mail ignorado (SMTP não configurado) — destinatário: ${to}`);
      return { sent: false, reason: 'SMTP não configurado' };
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `Link de pagamento — ${params.amountLabel}`,
      html: `
        <p>Você recebeu um link de pagamento${params.description ? ` para <strong>${params.description}</strong>` : ''}.</p>
        <p>Valor: <strong>${params.amountLabel}</strong></p>
        <p><a href="${params.url}">Clique aqui para pagar</a></p>
        <p>${params.url}</p>
      `,
    });

    return { sent: true };
  }
}
