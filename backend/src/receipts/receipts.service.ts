import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import type { Repository } from 'typeorm';
import { CheckoutLink } from '../checkout/entities/checkout-link.entity';
import { Order } from '../checkout/entities/order.entity';
import { GatewayStatus } from '../common/enums/gateway-status.enum';
import { centavosToBRL } from '../common/utils/money.util';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(CheckoutLink)
    private readonly checkoutLinkRepository: Repository<CheckoutLink>,
  ) {}

  async getReceiptData(orderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.status !== GatewayStatus.APPROVED) {
      throw new NotFoundException('Comprovante disponível apenas para pagamentos aprovados');
    }

    const checkoutLink = await this.checkoutLinkRepository.findOne({
      where: { id: order.checkoutLinkId },
    });

    return {
      order,
      checkoutLink,
      formattedAmount: centavosToBRL(order.amountCents),
      formattedNetAmount: order.netAmountCents ? centavosToBRL(order.netAmountCents) : undefined,
    };
  }

  async generatePdf(orderId: string): Promise<Buffer> {
    const { order, checkoutLink, formattedAmount, formattedNetAmount } =
      await this.getReceiptData(orderId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Comprovante de pagamento', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text('VBA Systems BaaS · Gateway Lera Box', {
        align: 'center',
      });
      doc.moveDown(2);

      doc.fillColor('#000').fontSize(12);
      doc.text(`Status: ${order.status}`);
      doc.text(`Valor: ${formattedAmount}`);
      if (formattedNetAmount) doc.text(`Valor líquido: ${formattedNetAmount}`);
      doc.text(`Método: ${order.method}`);
      if (order.brand) doc.text(`Bandeira: ${order.brand}`);
      if (order.installments) doc.text(`Parcelas: ${order.installments}x`);
      if (order.cardLast4) doc.text(`Cartão: **** **** **** ${order.cardLast4}`);
      if (order.payerDocument) doc.text(`Documento do pagador: ${order.payerDocument}`);
      doc.text(`Referência: ${order.externalReference}`);
      if (checkoutLink?.description) doc.text(`Descrição: ${checkoutLink.description}`);
      doc.text(`Data: ${order.updatedAt.toLocaleString('pt-BR')}`);
      doc.moveDown();
      doc.fontSize(9).fillColor('#888').text(`ID do pedido: ${order.id}`);

      doc.end();
    });
  }
}
