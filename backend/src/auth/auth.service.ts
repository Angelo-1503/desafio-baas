import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { GatewayAccountService } from '../gateway-client/gateway-account.service';
import { User } from '../users/entities/user.entity';
import { WebhooksService } from '../webhooks/webhooks.service';
import type { ActivateGatewayDto } from './dto/activate-gateway.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly gatewayAccountService: GatewayAccountService,
    private readonly webhooksService: WebhooksService,
  ) {}

  private sign(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private sanitize(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepository.save(
      this.userRepository.create({ name: dto.name, email: dto.email, passwordHash }),
    );

    try {
      await this.gatewayAccountService.createPendingAccount(user.id, {
        personType: dto.personType,
        name: dto.name,
        tradingName: dto.tradingName,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        zipCode: dto.zipCode,
        address: dto.address,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
      });
    } catch (error) {
      // Compensa a criação local: sem conta no gateway, este usuário fica preso e
      // impede novas tentativas de cadastro com o mesmo e-mail/documento.
      await this.userRepository.delete(user.id);
      throw error;
    }

    return { accessToken: this.sign(user), user: this.sanitize(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return { accessToken: this.sign(user), user: this.sanitize(user) };
  }

  async activateGateway(userId: string, dto: ActivateGatewayDto) {
    const account = await this.gatewayAccountService.activate(userId, dto.password);

    let webhooksRegistered = true;
    try {
      await this.webhooksService.registerDefaultWebhooks(account);
    } catch {
      // O login no gateway já foi concluído (o que importa para liberar o uso da conta);
      // o registro dos webhooks pode ser refeito depois via POST /webhooks/register.
      webhooksRegistered = false;
    }

    const { bearerTokenEnc: _bt, gatewayPasswordEnc: _gp, ...safe } = account;
    return { ...safe, webhooksRegistered };
  }
}
