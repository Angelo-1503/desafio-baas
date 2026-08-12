import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ActivateGatewayDto {
  @ApiProperty({ description: 'Senha recebida por e-mail do gateway Lera Box após o cadastro' })
  @IsString()
  @MinLength(1)
  password: string;
}
