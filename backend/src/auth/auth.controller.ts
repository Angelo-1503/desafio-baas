import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ActivateGatewayDto } from './dto/activate-gateway.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastro do lojista na BaaS + registro automático da conta no gateway Lera Box',
    description:
      'Cria o usuário local e chama POST /api/users do gateway com os dados KYC informados. ' +
      'A senha de acesso ao gateway chega por e-mail; use POST /auth/gateway/activate para concluir.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login do lojista na BaaS (independente do login no gateway)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('gateway/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirma a senha recebida por e-mail do gateway e ativa a integração',
    description: 'Faz login no gateway, guarda o token com segurança e registra os 3 webhooks.',
  })
  activateGateway(@CurrentUser() user: User, @Body() dto: ActivateGatewayDto) {
    return this.authService.activateGateway(user.id, dto);
  }
}
