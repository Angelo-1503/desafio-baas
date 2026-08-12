# VBA Systems BaaS — Integração com Gateway Lera Box

Aplicação Banking as a Service (BaaS) desenvolvida para o desafio técnico da VBA Systems. O produto é
usado pelo lojista (checkout, carteira, extrato, saques) e integra-se via HTTP ao gateway de
pagamento simulado **Lera Box** (`https://api.branchpay.com.br/api`) como processador.

## Arquitetura

```
[ React / Vite ]  --->  [ NestJS BaaS API ]  --->  [ Gateway Lera Box ]
                                |
                          [ MySQL BaaS ]
                                ^
                     [ Webhooks do Gateway ]
```

- O frontend nunca fala diretamente com o gateway — tudo passa pela API da BaaS.
- A BaaS tem banco próprio (MySQL); o banco do gateway nunca é acessado diretamente.
- Cada lojista tem sua própria conta no gateway (`gateway_accounts`), com token e senha
  criptografados em repouso (AES-256-GCM) e isolamento total de dados por conta.

## Stack

| Camada    | Tecnologias                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| Backend   | NestJS + TypeScript, TypeORM + MySQL, class-validator/class-transformer, Swagger, Passport JWT |
| Frontend  | React + Vite + React Router                                                  |
| Infra     | Docker Compose (dev e produção), Nginx + Certbot (deploy)                    |
| Qualidade | Biome (lint + format, único formatter do projeto — sem ESLint/Prettier)      |

## Estrutura do repositório

```
backend/    API NestJS (módulos por domínio: auth, gateway-client, checkout, wallet,
            fees, withdrawals, webhooks, receipts, mail)
frontend/   SPA React (páginas do lojista + checkout público do pagador)
infra/      Templates de nginx + script de emissão de certificado (deploy)
docs/       Cópia do contrato OpenAPI do gateway (referência)
docker-compose.yml        Ambiente de desenvolvimento local (mysql + backend + frontend)
docker-compose.prod.yml   Deploy em VPS com HTTPS (nginx + certbot)
```

## Como rodar localmente (sem Docker)

Pré-requisitos: Node 20+, MySQL 8 acessível (local ou via `docker compose up -d mysql`).

```bash
# 1. Banco de dados (mais simples via Docker, só o MySQL)
docker compose up -d mysql

# 2. Backend
cd backend
cp .env.example .env      # ajuste JWT_SECRET e CREDENTIALS_ENCRYPTION_KEY
npm install
npm run start:dev         # http://localhost:3000 · Swagger em /docs

# 3. Frontend (em outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

O schema do MySQL é criado automaticamente pelo TypeORM (`synchronize: true`) — não há
sistema de migrations dedicado neste desafio; para produção real isso seria substituído
por migrations versionadas.

## Como rodar com Docker Compose (dev)

```bash
cp backend/.env.example backend/.env   # ajuste os segredos
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (Swagger em `/docs`)
- MySQL exposto em `localhost:3306` (usuário/senha `baas`/`baas`)

## Variáveis de ambiente — backend (`backend/.env`)

| Variável                     | Obrigatória | Descrição                                                                 |
| ----------------------------- | :---------: | --------------------------------------------------------------------------- |
| `PORT`                        |             | Porta da API (padrão 3000)                                                  |
| `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | ✅   | Conexão MySQL própria da BaaS                                               |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | ✅        | Assinatura do JWT dos lojistas na BaaS (independente do token do gateway)   |
| `CREDENTIALS_ENCRYPTION_KEY`  | ✅          | Chave usada para criptografar (AES-256-GCM) a senha/token do gateway        |
| `GATEWAY_BASE_URL`            | ✅          | Base da API do gateway Lera Box                                             |
| `PUBLIC_BASE_URL`             | ✅          | URL pública desta API — usada ao registrar os webhooks no gateway. **Em dev local, o gateway não alcança `localhost`; use um túnel (ex: `ngrok http 3000`) e aponte esta variável para a URL pública gerada.** |
| `FRONTEND_URL`                |             | Usada para CORS e para montar o link enviado por e-mail                     |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` |       | Envio de link de pagamento por e-mail (diferencial). Sem `SMTP_HOST`, o envio é apenas logado e ignorado — nada quebra. |

## Variáveis de ambiente — frontend (`frontend/.env`)

| Variável        | Descrição                          |
| ---------------- | ----------------------------------- |
| `VITE_API_URL`   | URL base da API da BaaS             |

## Fluxo de uso

1. **Cadastro** (`/register`): o lojista informa dados da BaaS (e-mail/senha) + dados KYC exigidos
   pelo gateway (nome, telefone real, documento, endereço). Isso cria o usuário local **e** chama
   `POST /api/users` do gateway. A senha de acesso ao gateway chega por e-mail real.
2. **Ativação** (`/gateway/activate`): o lojista cola a senha recebida por e-mail. A BaaS faz login
   no gateway (`POST /api/auth/login`), guarda o token/senha criptografados e registra
   automaticamente os 3 webhooks (Pix, cartão, saque) apontando para `PUBLIC_BASE_URL`. Se o
   registro dos webhooks falhar (ex: `PUBLIC_BASE_URL` ainda não é uma URL pública válida), o login
   permanece válido e é possível tentar de novo via `POST /webhooks/register`, sem precisar refazer
   a ativação.
3. **Link de pagamento** (`/checkout-links`): o lojista cria um link com valor, descrição, métodos
   aceitos e validade. Se o link aceitar Cartão, o lojista também escolhe bandeira e parcelas
   nesse momento — a taxa é consultada em `GET /api/fees` e **travada no link**
   (`cardBrand`/`cardInstallments`/`cardFeePercent`), nunca calculada a partir de um valor vindo do
   pagador. A página pública fica em `/pay/:linkId`.
4. **Pagamento do pagador**: na página pública, o pagador escolhe Pix (QR/EMV via
   `POST /api/payments/pix`, informando só o CPF/CNPJ) ou Cartão (informa apenas os dados do
   cartão — bandeira, parcelas e taxa já foram definidas pelo lojista na criação do link).
5. **Webhook**: o gateway confirma o status final via webhook assinado
   (`X-Lera-Box-Signature`, HMAC-SHA256). A BaaS valida a assinatura, garante idempotência por
   evento e atualiza o pedido/link/saque correspondente.
6. **Carteira e extrato** (`/dashboard`): saldo e extrato com os filtros Sucesso/Falha/Expirado/Cancelado.
7. **Saque** (`/withdrawals`): solicitação e consulta de status.
8. **Comprovante** (`/receipt/:orderId`): página imprimível + PDF, disponível após aprovação.

## Credenciais de demonstração

Conta de lojista já cadastrada e com a conta do gateway **ativada** (login feito, webhooks
registrados), pronta para uso em `http://localhost:5173` (ou na URL pública, quando implantada):

| Campo   | Valor                        |
| ------- | ----------------------------- |
| E-mail  | `angelogiroletto@gmail.com`   |
| Senha   | `TesteBaas1234!`              |

Essa é a senha de acesso **à BaaS** (escolhida no cadastro) — não a senha do gateway Lera Box, que
chegou por e-mail durante a ativação e nunca é exposta pela aplicação nem armazenada em texto
plano.

## Documentação da API

- Swagger da BaaS: `http://localhost:3000/docs` (JSON em `/docs-json`)
- Swagger do gateway Lera Box: `https://api.branchpay.com.br/docs` — usado como fonte de verdade
  para o contrato de integração (cópia do JSON em `docs/gateway-openapi.json`).

## Segurança

- Senha e token do gateway nunca são expostos ao frontend; ficam criptografados (AES-256-GCM) no
  MySQL da BaaS.
- Reautenticação automática: se o token do gateway expira (401), a BaaS reloga com a senha salva e
  repete a chamada uma única vez (`GatewayAccountService.withAuth`).
- Webhooks validam `X-Lera-Box-Signature` (HMAC-SHA256 sobre o corpo bruto da requisição) com um
  segredo único por conta; eventos são gravados com chave de idempotência antes de processados.
- Isolamento por conta: toda chamada ao gateway usa o token da conta do usuário autenticado — não
  há como um lojista enxergar carteira/transações/webhooks de outro.
- `class-validator` com `whitelist`/`forbidNonWhitelisted` rejeita campos não esperados em qualquer
  payload de entrada.

## Diferenciais implementados

- ✅ Docker Compose (dev e produção) para API, frontend e MySQL.
- ✅ Comprovante de pagamento em PDF (`pdfkit`) e página imprimível.
- ✅ Envio do link de pagamento por e-mail (`nodemailer`, configurável via SMTP; sem credenciais,
  o recurso fica desabilitado de forma graciosa).
- ✅ Artefatos prontos para deploy em VPS com HTTPS (`docker-compose.prod.yml` + Nginx + Certbot) —
  ver seção abaixo.
- ⛔ Envio por WhatsApp: fora de escopo (exigiria conta Business API própria).

## Deploy: Render (backend) + Vercel (frontend) + Aiven (MySQL)

Alternativa sem VPS, usando serviços gerenciados com tier gratuito. Render não oferece MySQL
gerenciado no plano free (só Postgres, e discos persistentes exigem plano pago) — por isso o banco
fica na Aiven, que tem MySQL sempre grátis.

1. **MySQL na Aiven**: crie uma conta em https://aiven.io, um serviço MySQL no plano gratuito, e
   anote host, porta, usuário, senha e nome do banco (a Aiven exige TLS, já suportado via
   `DATABASE_SSL=true`).
2. **Backend no Render**: `New > Blueprint`, aponte para este repositório (usa o `render.yaml` da
   raiz). No formulário de criação, preencha as variáveis marcadas como secretas: os dados do MySQL
   da Aiven, `PUBLIC_BASE_URL` (deixe em branco por ora) e `FRONTEND_URL`. Depois do primeiro
   deploy, copie a URL pública atribuída (ex: `https://baas-backend.onrender.com`), volte em
   Environment e preencha `PUBLIC_BASE_URL` com ela.
3. **Frontend na Vercel**: `New Project`, importe o repositório, defina **Root Directory** como
   `frontend`. A Vercel detecta o Vite automaticamente. Configure a env var `VITE_API_URL` com a URL
   do backend no Render. O `frontend/vercel.json` já cuida do fallback de rotas do React Router.
4. **Fechar o ciclo**: com a URL da Vercel em mãos, atualize `FRONTEND_URL` no Render (usada para
   CORS e para montar o link de pagamento enviado por e-mail) e redeploy o backend.
5. **Webhooks**: como `PUBLIC_BASE_URL` só existe depois do primeiro deploy, os webhooks
   registrados durante uma eventual ativação anterior (ex: feita em dev local) vão apontar para a
   URL antiga. Rode `POST /webhooks/register` autenticado (ou reative a conta do gateway) para
   registrá-los apontando para a URL definitiva do Render.

O plano free do Render "dorme" o serviço após um período de inatividade — a primeira requisição
após esse período (incluindo a entrega de um webhook) pode demorar alguns segundos a mais.

## Deploy alternativo: VPS próprio + HTTPS

Pré-requisitos: um VPS com Docker instalado e dois subdomínios (`app.` e `api.`) apontando para o IP
do servidor.

```bash
cp .env.example .env                                    # DOMAIN_APP, DOMAIN_API, CERTBOT_EMAIL, senhas do MySQL
cp backend/.env.production.example backend/.env.production  # ajuste segredos e PUBLIC_BASE_URL/FRONTEND_URL

# emissão inicial do certificado (uma vez, com o DNS já propagado)
set -a && source .env && set +a
./infra/nginx/init-letsencrypt.sh

# subir a stack completa
docker compose -f docker-compose.prod.yml up -d --build
```

O Nginx expõe 80/443, faz redirect HTTP→HTTPS e roteia por domínio: `DOMAIN_APP` → frontend,
`DOMAIN_API` → backend. O serviço `certbot` renova os certificados automaticamente em loop.

Depois do deploy, registre `PUBLIC_BASE_URL=https://<DOMAIN_API>` em `backend/.env.production` e
reative os webhooks (reativar a conta do gateway ou recriar) para que apontem para a URL pública
definitiva.

## Limitações conhecidas / notas de engenharia

- **Schema via `synchronize: true`**: adequado ao escopo do desafio; um ambiente real usaria
  migrations versionadas do TypeORM.
- **Payload de webhook**: o Swagger do gateway não detalha 100% o formato exato do corpo enviado
  (só confirma que é POST JSON com `status`). O parsing foi implementado de forma defensiva
  (grava sempre o payload bruto em `webhook_events`, extrai campos por nomes prováveis como `id`,
  `externalReference`, `status`) e deve ser ajustado caso o formato real do sandbox divirja.
- **Túnel para webhooks em dev local**: como o gateway precisa alcançar a API pela internet, testes
  locais de webhook exigem um túnel (ex: `ngrok`) apontado em `PUBLIC_BASE_URL` antes de ativar a
  conta do gateway.
