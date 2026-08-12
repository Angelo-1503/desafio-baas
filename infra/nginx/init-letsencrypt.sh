#!/usr/bin/env bash
# Emissão inicial dos certificados Let's Encrypt para DOMAIN_APP e DOMAIN_API.
# Rodar uma única vez, com o DNS de ambos os domínios já apontando para o VPS.
#
# Uso: DOMAIN_APP=app.seudominio.com DOMAIN_API=api.seudominio.com \
#      CERTBOT_EMAIL=voce@email.com ./infra/nginx/init-letsencrypt.sh
set -euo pipefail

: "${DOMAIN_APP:?defina DOMAIN_APP}"
: "${DOMAIN_API:?defina DOMAIN_API}"
: "${CERTBOT_EMAIL:?defina CERTBOT_EMAIL}"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Subindo nginx apenas em HTTP para responder o desafio ACME..."
$COMPOSE up -d nginx

echo "==> Solicitando certificados para $DOMAIN_APP e $DOMAIN_API..."
$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  -d "$DOMAIN_APP" -d "$DOMAIN_API" \
  --agree-tos --no-eff-email

echo "==> Certificados emitidos. Reiniciando nginx com HTTPS habilitado..."
$COMPOSE restart nginx

echo "==> Pronto. Renovação automática fica a cargo do serviço certbot (roda em loop)."
