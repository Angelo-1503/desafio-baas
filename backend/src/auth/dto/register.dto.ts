import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome completo (PF) ou razão social (PJ)' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'maria@empresa.com', description: 'E-mail real do lojista' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SenhaForte123!',
    description: 'Senha de acesso à BaaS (mín. 8 caracteres)',
  })
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['PF', 'PJ'] })
  @IsIn(['PF', 'PJ'])
  personType: 'PF' | 'PJ';

  @ApiProperty({ required: false, example: 'Loja da Maria' })
  @IsOptional()
  @IsString()
  tradingName?: string;

  @ApiProperty({ example: '11999998888', description: 'Celular real com DDD (11 dígitos)' })
  @Matches(/^\d{10,11}$/, { message: 'phone deve conter 10 ou 11 dígitos' })
  phone: string;

  @ApiProperty({ example: '12345678901', description: 'CPF (11) ou CNPJ (14) — pode ser fictício' })
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'document deve ter 11 (CPF) ou 14 (CNPJ) dígitos' })
  document: string;

  @ApiProperty({ example: '01310100' })
  @Matches(/^\d{8}$/, { message: 'zipCode deve conter 8 dígitos' })
  zipCode: string;

  @ApiProperty({ example: 'Av. Paulista' })
  @IsString()
  address: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  number: string;

  @ApiProperty({ required: false, example: 'Sala 12' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP' })
  @Length(2, 2)
  state: string;
}
