import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendCheckoutLinkEmailDto {
  @ApiProperty({ example: 'pagador@example.com' })
  @IsEmail()
  email: string;
}
