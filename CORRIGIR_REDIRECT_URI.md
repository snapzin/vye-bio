# ⚠️ CORREÇÃO URGENTE: DISCORD_REDIRECT_URI

## Problema Identificado

A variável `DISCORD_REDIRECT_URI` no Vercel tem um espaço e `\r\n` no final:
```
"https://vye-v1.vercel.app/api/auth/discord/callback \r\n"
```

Isso faz o Discord rejeitar a requisição porque o `redirect_uri` não corresponde exatamente ao configurado.

## Solução: Corrigir Manualmente no Painel do Vercel

### Passo 1: Acessar o Painel
1. Acesse: https://vercel.com/snapzin/vye-v1/settings/environment-variables

### Passo 2: Remover a Variável Atual
1. Encontre `DISCORD_REDIRECT_URI` na lista
2. Clique nos três pontos (⋯) ao lado
3. Clique em **"Remove"**
4. Confirme a remoção para **Production**, **Preview** e **Development**

### Passo 3: Adicionar Novamente com Valor Correto
1. Clique em **"Add New"**
2. **Name**: `DISCORD_REDIRECT_URI`
3. **Value**: `https://vye-v1.vercel.app/api/auth/discord/callback`
   - ⚠️ **IMPORTANTE**: Copie e cole exatamente este valor, SEM espaços no final!
4. Marque os ambientes: **Production**, **Preview**, **Development**
5. Clique em **"Save"**

### Passo 4: Verificar no Discord Developer Portal
1. Acesse: https://discord.com/developers/applications
2. Selecione sua aplicação
3. Vá em **OAuth2** > **Redirects**
4. Certifique-se de que está configurado exatamente:
   ```
   https://vye-v1.vercel.app/api/auth/discord/callback
   ```
   - Sem trailing slash
   - Com `https`
   - Sem espaços

### Passo 5: Fazer Redeploy
Após corrigir, faça um novo deploy:
- Acesse o último deployment no Vercel
- Clique em **"Redeploy"**
- OU faça um novo commit para triggerar deploy automático

## Verificação

Após corrigir, você pode verificar se está correto:
```bash
vercel env pull .env.vercel
Get-Content .env.vercel | Select-String "DISCORD_REDIRECT_URI"
```

Deve mostrar:
```
DISCORD_REDIRECT_URI="https://vye-v1.vercel.app/api/auth/discord/callback"
```

**SEM** espaços ou `\r\n` no final!

