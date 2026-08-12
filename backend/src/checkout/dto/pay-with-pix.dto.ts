import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class PayWithPixDto {
  @ApiProperty({ example: '12345678901', description: 'CPF/CNPJ do pagador (pode ser fictício)' })
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'payerDocument deve ter 11 (CPF) ou 14 (CNPJ) dígitos' })
  payerDocument: string;
}
