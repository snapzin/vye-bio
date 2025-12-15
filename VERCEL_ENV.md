# Variáveis de Ambiente Necessárias no Vercel

⚠️ **IMPORTANTE**: O erro 500 ao fazer login com Discord geralmente indica que alguma dessas variáveis não está configurada.

Configure as seguintes variáveis de ambiente no painel do Vercel (Settings > Environment Variables):

## Supabase (Obrigatório - causa erro se não configurado)
- `SUPABASE_URL` ou `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave pública/anônima do Supabase

## Discord OAuth (Obrigatório - causa erro se não configurado)
- `DISCORD_CLIENT_ID` ou `VITE_DISCORD_CLIENT_ID` - ID do cliente Discord
- `DISCORD_CLIENT_SECRET` ou `VITE_DISCORD_CLIENT_SECRET` - Secret do cliente Discord
- `DISCORD_REDIRECT_URI` ou `VITE_DISCORD_REDIRECT_URI` - URL de callback (exemplo: `https://seu-projeto.vercel.app/api/auth/discord/callback`)

## JWT (Obrigatório - causa crash se não configurado) ⚠️
- `JWT_SECRET` ou `VITE_JWT_SECRET` - Chave secreta para assinar tokens JWT
  - **IMPORTANTE**: Use uma string longa e aleatória (ex: gere com `openssl rand -hex 32`)
  - **NÃO** use valores padrão como "your-secret-key-change-in-production"

## Valorant API (Opcional)
- `HENRIKDEV_KEY` ou `VITE_HENRIKDEV_KEY` - Chave da API do HenrikDev para dados do Valorant

## Pagamentos (Opcional - escolha um)
### MisticPay
- `VITE_MISTICPAY_CLIENT_ID` - ID do cliente MisticPay
- `VITE_MISTICPAY_CLIENT_SECRET` - Secret do cliente MisticPay

### VisionWallet
- `VITE_VISIONWALLET_API_KEY` - Chave da API VisionWallet

## Observações Importantes

1. **Para Serverless Functions**: As variáveis SEM o prefixo `VITE_` têm prioridade nas funções serverless (API routes)
2. **Para Frontend**: As variáveis COM o prefixo `VITE_` são expostas no build do frontend
3. **Recomendação**: Configure AMBAS as versões (com e sem `VITE_`) para garantir compatibilidade total

## Como Configurar

1. Acesse seu projeto no Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável acima
4. Aplique para Production, Preview e Development
5. Faça um novo deployment após adicionar as variáveis

