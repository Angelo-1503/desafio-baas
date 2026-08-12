import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * Bandeira, parcelas e taxa já foram definidas pelo lojista na criação do link
 * (`CheckoutLink.cardBrand/cardInstallments/cardFeePercent`) — o pagador só informa o cartão.
 */
export class PayWithCardDto {
  @ApiProperty({ example: '4111111111111111' })
  @Matches(/^\d{13,19}$/, { message: 'cardNumber inválido' })
  cardNumber: string;

  @ApiProperty({ example: 'MARIA SILVA' })
  @IsString()
  cardHolder: string;

  @ApiProperty({ example: '12' })
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'expiryMonth deve ser 01-12' })
  expiryMonth: string;

  @ApiProperty({ example: '2030' })
  @Matches(/^\d{4}$/, { message: 'expiryYear deve ter 4 dígitos' })
  expiryYear: string;

  @ApiProperty({ example: '123' })
  @Matches(/^\d{3,4}$/, { message: 'cvv inválido' })
  cvv: string;
}
