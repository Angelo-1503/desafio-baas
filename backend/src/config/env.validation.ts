import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  DATABASE_HOST: string;

  @IsInt()
  DATABASE_PORT: number = 3306;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  /** Ativar para bancos gerenciados que exigem TLS (ex: Aiven). */
  @IsIn(['true', 'false'])
  @IsOptional()
  DATABASE_SSL: string = 'false';

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  CREDENTIALS_ENCRYPTION_KEY: string;

  @IsUrl({ require_tld: false })
  GATEWAY_BASE_URL: string;

  @IsUrl({ require_tld: false })
  PUBLIC_BASE_URL: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsInt()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${messages}`);
  }

  return validatedConfig;
}
