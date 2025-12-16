# Configuração Rápida das Variáveis de Ambiente no Vercel

## Passo a Passo para Configurar JWT_SECRET e Outras Variáveis

### 1. Acesse o Painel do Vercel
1. Vá para https://vercel.com
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Configure as Variáveis de Ambiente

1. **Clique em "Settings"** (no menu superior)
2. **Clique em "Environment Variables"** (no menu lateral esquerdo)

### 3. Adicione Cada Variável (uma por uma)

Para cada variável abaixo, clique em **"Add New"** e preencha:

#### JWT_SECRET (IMPORTANTE - Use a chave gerada)
- **Key**: `JWT_SECRET`
- **Value**: `YrUxe0mMw37hx1YhWS562OXNjpRUSszwgnDwhk0su7Y6c2w8PPjrrPf15MjnxGSiwON7ri7EzX0MNciFfKzFDu`
- **Environments**: Marque todas (Production, Preview, Development)

#### Supabase (Substitua pelos seus valores reais)
- **Key**: `SUPABASE_URL`
- **Value**: `https://seu-projeto.supabase.co` (seu URL do Supabase)
- **Environments**: Todas

- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `sua-chave-anon-aqui` (sua chave anon do Supabase)
- **Environments**: Todas

#### Discord OAuth (Substitua pelos seus valores reais)
- **Key**: `DISCORD_CLIENT_ID`
- **Value**: `seu-client-id-discord` (do Discord Developer Portal)
- **Environments**: Todas

- **Key**: `DISCORD_CLIENT_SECRET`
- **Value**: `seu-client-secret-discord` (do Discord Developer Portal)
- **Environments**: Todas

- **Key**: `DISCORD_REDIRECT_URI`
- **Value**: `https://seu-projeto.vercel.app/api/auth/discord/callback` (substitua `seu-projeto` pelo nome real do seu projeto no Vercel)
- **Environments**: Todas

### 4. Depois de Adicionar Todas as Variáveis

1. **Redeploy o projeto**: Vá em "Deployments", encontre o deployment mais recente e clique nos 3 pontos (...), depois em "Redeploy"

OU

2. **Faça um novo commit** no GitHub para trigger um novo deployment automaticamente

### 5. Verificar se Funcionou

1. Aguarde o deployment terminar
2. Tente fazer login com Discord
3. Se ainda der erro, verifique os logs em "Deployments" > clique no deployment > "Functions" > clique na função que deu erro > veja os logs

## Importante

⚠️ **NUNCA** compartilhe suas chaves secretas publicamente!
⚠️ A chave JWT_SECRET que você gerou já está documentada aqui - considere regenerar uma nova se este arquivo for commitado no repositório público.

