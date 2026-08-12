import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { User } from '../users/entities/user.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalsService } from './withdrawals.service';

@ApiTags('Withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Solicita saque para uma chave Pix (proxy de POST /api/withdrawals)' })
  create(@CurrentUser() user: User, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os saques do lojista autenticado' })
  list(@CurrentUser() user: User) {
    return this.withdrawalsService.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta status de um saque (proxy de GET /api/withdrawals/:id)' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.withdrawalsService.findOne(user.id, id);
  }
}
