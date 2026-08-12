import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @IsString()
  password: string;
}
