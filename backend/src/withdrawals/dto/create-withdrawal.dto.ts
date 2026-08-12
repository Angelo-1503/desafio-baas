import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Matches } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 10000, description: 'Valor do saque em centavos' })
  @IsInt()
  @IsPositive()
  amountCents: number;

  @ApiProperty({ example: 'maria@empresa.com', description: 'Chave Pix de destino' })
  @IsString()
  pixKey: string;

  @ApiProperty({ required: false, example: 'Saque para conta pessoal' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '12345678901', description: 'CPF do titular da chave Pix' })
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'document deve ter 11 (CPF) ou 14 (CNPJ) dígitos' })
  document: string;
}
