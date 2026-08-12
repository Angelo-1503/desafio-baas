import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Criptografa segredos do gateway (senha, bearer token) em repouso no MySQL da BaaS.
 * Formato armazenado: base64(iv):base64(authTag):base64(ciphertext)
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
    this.key = scryptSync(secret, 'baas-gateway-credentials', 32);
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      ':',
    );
  }

  decrypt(payload: string): string {
    const [ivB64, authTagB64, dataB64] = payload.split(':');
    if (!ivB64 || !authTagB64 || !dataB64) {
      throw new InternalServerErrorException('Payload criptografado em formato inválido');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
