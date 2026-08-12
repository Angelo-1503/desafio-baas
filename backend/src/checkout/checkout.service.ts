import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import type { Repository } from 'typeorm';
import { GatewayStatus } from '../common/enums/gateway-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { centavosToBRL } from '../common/utils/money.util';
import { FeesService } from '../fees/fees.service';
import { GatewayAccountService } from '../gateway-client/gateway-account.service';
import { GatewayHttpService } from '../gateway-client/gateway-http.service';
import { MailService } from '../mail/mail.service';
import type { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import type { PayWithCardDto } from './dto/pay-with-card.dto';
import type { PayWithPixDto } from './dto/pay-with-pix.dto';
import type { SendCheckoutLinkEmailDto } from './dto/send-checkout-link-email.dto';
import { CheckoutLink, CheckoutLinkStatus } from './entities/checkout-link.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutLink)
    private readonly checkoutLinkRepository: Repository<CheckoutLink>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly gatewayAccountService: GatewayAccountService,
    private readonly gatewayHttpService: GatewayHttpService,
    private readonly feesService: FeesService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateCheckoutLinkDto): Promise<CheckoutLink> {
    const expiresAt = new Date(Date.now() + (dto.expiresInMinutes ?? 60) * 60_000);

    const link = this.checkoutLinkRepository.create({
      userId,
      amountCents: dto.amountCents,
      description: dto.description,
      allowedMethods: dto.allowedMethods,
      expiresAt,
      status: CheckoutLinkStatus.ACTIVE,
    });

    if (dto.allowedMethods.includes(PaymentMethod.CARD)) {
      if (!dto.cardBrand || !dto.cardInstallments) {
        throw new BadRequestException(
          'cardBrand e cardInstallments são obrigatórios quando CARD está em allowedMethods',
        );
      }

      const feePercent = await this.feesService.findFeePercent(dto.cardBrand, dto.cardInstallments);
      if (feePercent === undefined) {
        throw new BadRequestException(
          `Não há taxa cadastrada para ${dto.cardBrand} em ${dto.cardInstallments}x`,
        );
      }

      link.cardBrand = dto.cardBrand;
      link.cardInstallments = dto.cardInstallments;
      link.cardFeePercent = feePercent.toFixed(2);
    }

    return this.checkoutLinkRepository.save(link);
  }

  async listForOwner(userId: string): Promise<CheckoutLink[]> {
    return this.checkoutLinkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findForOwner(userId: string, id: string): Promise<CheckoutLink> {
    const link = await this.checkoutLinkRepository.findOne({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link de checkout não encontrado');
    return link;
  }

  async listOrdersForOwner(userId: string, linkId: string): Promise<Order[]> {
    await this.findForOwner(userId, linkId);
    return this.orderRepository.find({
      where: { checkoutLinkId: linkId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(userId: string, id: string): Promise<CheckoutLink> {
    const link = await this.findForOwner(userId, id);
    if (link.status !== CheckoutLinkStatus.ACTIVE) {
      throw new ConflictException('Somente links ativos podem ser cancelados');
    }
    link.status = CheckoutLinkStatus.CANCELLED;
    return this.checkoutLinkRepository.save(link);
  }

  /** Carrega o link público e expira automaticamente se o prazo já passou. */
  async findPublic(id: string): Promise<CheckoutLink> {
    const link = await this.checkoutLinkRepository.findOne({ where: { id } });
    if (!link) throw new NotFoundException('Link de checkout não encontrado');

    if (link.status === CheckoutLinkStatus.ACTIVE && link.expiresAt.getTime() < Date.now()) {
      link.status = CheckoutLinkStatus.EXPIRED;
      await this.checkoutLinkRepository.save(link);
    }

    return link;
  }

  private assertPayable(link: CheckoutLink, method: PaymentMethod) {
    if (!link.allowedMethods.includes(method)) {
      throw new BadRequestException(`Este link não aceita pagamento via ${method}`);
    }
    if (link.status !== CheckoutLinkStatus.ACTIVE) {
      throw new ConflictException(`Link de checkout está ${link.status.toLowerCase()}`);
    }
  }

  async payWithPix(linkId: string, dto: PayWithPixDto): Promise<Order> {
    const link = await this.findPublic(linkId);
    this.assertPayable(link, PaymentMethod.PIX);

    const externalReference = `${link.id}-${nanoid(8)}`;

    const response = await this.gatewayAccountService.withAuth(link.userId, (token) =>
      this.gatewayHttpService.createPixPayment(token, {
        amount: link.amountCents,
        description: link.description,
        payerDocument: dto.payerDocument,
        externalReference,
      }),
    );

    const order = this.orderRepository.create({
      checkoutLinkId: link.id,
      method: PaymentMethod.PIX,
      status: response.status as GatewayStatus,
      amountCents: link.amountCents,
      externalReference,
      gatewayPaymentId: response.id,
      payerDocument: dto.payerDocument,
      qrCodeBase64: response.qrCodeBase64,
      emv: response.emv,
    });

    const saved = await this.orderRepository.save(order);
    await this.syncLinkStatus(link, saved.status);

    return saved;
  }

  async payWithCard(linkId: string, dto: PayWithCardDto): Promise<Order> {
    const link = await this.findPublic(linkId);
    this.assertPayable(link, PaymentMethod.CARD);

    // Bandeira/parcelas/taxa já foram travadas pelo lojista na criação do link.
    if (!link.cardBrand || !link.cardInstallments || !link.cardFeePercent) {
      throw new BadRequestException('Este link não tem taxa de cartão configurada');
    }
    const cardBrand = link.cardBrand;
    const cardInstallments = link.cardInstallments;
    const feePercent = Number(link.cardFeePercent);

    const externalReference = `${link.id}-${nanoid(8)}`;

    const response = await this.gatewayAccountService.withAuth(link.userId, (token) =>
      this.gatewayHttpService.createCardPayment(token, {
        amount: link.amountCents,
        description: link.description,
        externalReference,
        cardNumber: dto.cardNumber,
        cardHolder: dto.cardHolder,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
        cvv: dto.cvv,
        installments: cardInstallments,
        feePercent,
      }),
    );

    const feeAmountCents = Math.round((link.amountCents * feePercent) / 100);

    const order = this.orderRepository.create({
      checkoutLinkId: link.id,
      method: PaymentMethod.CARD,
      status: response.status as GatewayStatus,
      amountCents: link.amountCents,
      feePercent: link.cardFeePercent,
      feeAmountCents,
      netAmountCents: link.amountCents - feeAmountCents,
      brand: cardBrand,
      installments: cardInstallments,
      cardLast4: dto.cardNumber.slice(-4),
      externalReference,
      gatewayPaymentId: response.id,
    });

    const saved = await this.orderRepository.save(order);
    await this.syncLinkStatus(link, saved.status);

    return saved;
  }

  async getPublicOrder(linkId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, checkoutLinkId: linkId },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async sendByEmail(userId: string, linkId: string, dto: SendCheckoutLinkEmailDto) {
    const link = await this.findForOwner(userId, linkId);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    return this.mailService.sendCheckoutLink(dto.email, {
      amountLabel: centavosToBRL(link.amountCents),
      description: link.description,
      url: `${frontendUrl}/pay/${link.id}`,
    });
  }

  private async syncLinkStatus(link: CheckoutLink, orderStatus: GatewayStatus) {
    if (orderStatus === GatewayStatus.APPROVED) {
      link.status = CheckoutLinkStatus.PAID;
      await this.checkoutLinkRepository.save(link);
    }
  }
}
