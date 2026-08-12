import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { CardBrand, PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreateCheckoutLinkDto {
  @ApiProperty({ example: 15000, description: 'Valor em centavos (ex: 15000 = R$ 150,00)' })
  @IsInt()
  @IsPositive()
  amountCents: number;

  @ApiProperty({ required: false, example: 'Pedido #123' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: PaymentMethod,
    isArray: true,
    example: [PaymentMethod.PIX, PaymentMethod.CARD],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PaymentMethod, { each: true })
  allowedMethods: PaymentMethod[];

  @ApiProperty({ required: false, default: 60, description: 'Minutos até o link expirar' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  expiresInMinutes?: number = 60;

  @ApiProperty({
    enum: CardBrand,
    required: false,
    description: 'Obrigatório quando CARD está em allowedMethods — consultado via GET /fees',
  })
  @ValidateIf((dto: CreateCheckoutLinkDto) => dto.allowedMethods?.includes(PaymentMethod.CARD))
  @IsIn(Object.values(CardBrand))
  cardBrand?: CardBrand;

  @ApiProperty({
    required: false,
    minimum: 1,
    maximum: 21,
    description: 'Obrigatório quando CARD está em allowedMethods',
  })
  @ValidateIf((dto: CreateCheckoutLinkDto) => dto.allowedMethods?.includes(PaymentMethod.CARD))
  @IsInt()
  @Min(1)
  @Max(21)
  cardInstallments?: number;
}
