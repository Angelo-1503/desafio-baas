import { randomBytes } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { EncryptionService } from '../common/encryption.service';
import { GatewayAccount, GatewayAccountStatus } from './entities/gateway-account.entity';
import { GatewayHttpService } from './gateway-http.service';
import { GatewayUnauthorizedError } from './gateway.errors';
import type { GatewayCreateUserPayload } from './interfaces/gateway.types';

@Injectable()
export class GatewayAccountService {
  constructor(
    @InjectRepository(GatewayAccount)
    private readonly gatewayAccountRepository: Repository<GatewayAccount>,
    private readonly gatewayHttpService: GatewayHttpService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createPendingAccount(
    userId: string,
    kyc: GatewayCreateUserPayload,
  ): Promise<GatewayAccount> {
    await this.gatewayHttpService.registerUser(kyc);

    const account = this.gatewayAccountRepository.create({
      userId,
      document: kyc.document,
      webhookSecret: randomBytes(24).toString('hex'),
      status: GatewayAccountStatus.PENDING_ACTIVATION,
    });

    return this.gatewayAccountRepository.save(account);
  }

  async findByUserId(userId: string): Promise<GatewayAccount> {
    const account = await this.gatewayAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('Conta do gateway não encontrada para este usuário');
    }
    return account;
  }

  async activate(userId: string, password: string): Promise<GatewayAccount> {
    const account = await this.findByUserId(userId);

    if (account.status === GatewayAccountStatus.ACTIVE) {
      throw new ConflictException('Conta do gateway já está ativa');
    }

    const { access_token, codigoCliente, chaveLoja } = await this.gatewayHttpService.login(
      account.document,
      password,
    );

    account.bearerTokenEnc = this.encryptionService.encrypt(access_token);
    account.gatewayPasswordEnc = this.encryptionService.encrypt(password);
    account.codigoCliente = String(codigoCliente);
    account.chaveLoja = chaveLoja;
    account.status = GatewayAccountStatus.ACTIVE;

    return this.gatewayAccountRepository.save(account);
  }

  private async relogin(account: GatewayAccount): Promise<string> {
    if (!account.gatewayPasswordEnc) {
      throw new NotFoundException(
        'Conta do gateway sem credenciais salvas para relogin automático',
      );
    }

    const password = this.encryptionService.decrypt(account.gatewayPasswordEnc);
    const { access_token } = await this.gatewayHttpService.login(account.document, password);

    account.bearerTokenEnc = this.encryptionService.encrypt(access_token);
    await this.gatewayAccountRepository.save(account);

    return access_token;
  }

  /**
   * Executa `fn` autenticado com o token atual da conta; se o gateway responder 401,
   * refaz login com a senha salva (criptografada) e tenta novamente uma única vez.
   */
  async withAuth<T>(userId: string, fn: (token: string) => Promise<T>): Promise<T> {
    const account = await this.findByUserId(userId);

    if (account.status !== GatewayAccountStatus.ACTIVE || !account.bearerTokenEnc) {
      throw new ConflictException(
        'Conta do gateway ainda não foi ativada. Confirme a senha recebida por e-mail.',
      );
    }

    const token = this.encryptionService.decrypt(account.bearerTokenEnc);

    try {
      return await fn(token);
    } catch (error) {
      if (error instanceof GatewayUnauthorizedError) {
        const freshToken = await this.relogin(account);
        return fn(freshToken);
      }
      throw error;
    }
  }
}
