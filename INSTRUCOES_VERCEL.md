# Instruções para Configurar Variáveis de Ambiente na Vercel

## Problema Resolvido

O erro **500: INTERNAL_SERVER_ERROR** no login do Discord foi causado pela falta de variáveis de ambiente configuradas corretamente na Vercel. As funções serverless (API routes) não têm acesso a variáveis com prefixo `VITE_`.

## Variáveis Obrigatórias na Vercel

Acesse o painel da Vercel e configure as seguintes variáveis de ambiente:

### 1. Discord OAuth

```
DISCORD_CLIENT_ID=SEU_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=SEU_DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=https://SEU_DOMINIO.vercel.app/api/auth/discord/callback
```

### 2. Supabase

```
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3. JWT Secret (CRÍTICO)

```
JWT_SECRET=GERAR_UMA_CHAVE_FORTE_E_UNICA
```

**⚠️ IMPORTANTE**: Troque este valor por uma chave forte e única em produção. Você pode gerar uma usando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Variáveis Opcionais (Frontend)

Estas variáveis com prefixo `VITE_` são para o frontend React/Vite. Configure também na Vercel:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_DISCORD_CLIENT_ID=SEU_DISCORD_CLIENT_ID
VITE_HENRIKDEV_KEY=SUA_HENRIKDEV_KEY
VITE_VISIONWALLET_API_KEY=SUA_VISIONWALLET_API_KEY
```

## Como Configurar na Vercel

1. Acesse: https://vercel.com/snapzin/vye-v1/settings/environment-variables
2. Para cada variável:
   - Clique em "Add New"
   - Cole o nome da variável (ex: `JWT_SECRET`)
   - Cole o valor
   - Selecione os ambientes: **Production**, **Preview**, **Development**
   - Clique em "Save"
3. Após adicionar todas, faça um novo deploy ou clique em "Redeploy" no último deployment

## Verificação

Após configurar e fazer redeploy:

1. Acesse: https://vye.vercel.app
2. Clique no botão de login com Discord
3. O login deve funcionar sem erro 500

## Arquivo .env Local

O arquivo `.env` local já foi atualizado com todas as variáveis necessárias (com e sem prefixo `VITE_`) para desenvolvimento local.

## Segurança

**⚠️ NUNCA** faça commit do arquivo `.env` no Git. Ele já está no `.gitignore`, mas verifique antes de fazer push.
