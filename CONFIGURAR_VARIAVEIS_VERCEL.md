# Como Configurar Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE
As variáveis de ambiente devem ser configuradas no **painel do Vercel**, não apenas no arquivo `.env` local.

## URL do Supabase Configurada
✅ `SUPABASE_URL = https://SEU_PROJETO.supabase.co`

**Você precisa configurar esta variável no Vercel com este valor exato.**

## Variáveis Obrigatórias para Configurar no Vercel

### 1. Supabase (Você já tem a URL)
- **`SUPABASE_URL`** = `https://SEU_PROJETO.supabase.co`
- **`SUPABASE_ANON_KEY`** = (Você precisa pegar no painel do Supabase)
  - Acesse o painel do seu projeto Supabase → Settings → API
  - Copie a chave "anon" ou "public"

### 2. JWT Secret (OBRIGATÓRIO - causa erro 500 se não configurado)
- **`JWT_SECRET`** = (Gere uma chave segura)
  - **Como gerar:**
    ```bash
    # Linux/Mac
    openssl rand -hex 32
    
    # Windows PowerShell
    [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
    ```
  - Ou use um gerador online: https://randomkeygen.com/

### 3. Discord OAuth
- **`DISCORD_CLIENT_ID`** = (Seu Client ID do Discord)
- **`DISCORD_CLIENT_SECRET`** = (Seu Client Secret do Discord)
- **`DISCORD_REDIRECT_URI`** = `https://vye-v1.vercel.app/api/auth/discord/callback`

## Como Configurar no Vercel

1. **Acesse o painel do Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto `vye-v1`

2. **Vá em Settings:**
   - Clique em **Settings** no menu lateral
   - Clique em **Environment Variables**

3. **Adicione cada variável:**
   - Clique em **Add New**
   - Digite o **Name** (ex: `SUPABASE_URL`)
   - Digite o **Value** (ex: `https://SEU_PROJETO.supabase.co`)
   - Marque os ambientes: **Production**, **Preview**, **Development**
   - Clique em **Save**

4. **Repita para todas as variáveis:**
   - `SUPABASE_URL` = `https://SEU_PROJETO.supabase.co`
   - `SUPABASE_URL` = `https://SEU_PROJETO.supabase.co`
   - `SUPABASE_ANON_KEY` = (sua chave do Supabase)
   - `JWT_SECRET` = (chave gerada)
   - `DISCORD_CLIENT_ID` = (seu Client ID)
   - `DISCORD_CLIENT_SECRET` = (seu Client Secret)
   - `DISCORD_REDIRECT_URI` = `https://vye-v1.vercel.app/api/auth/discord/callback`

5. **Faça um novo deploy:**
   - Vá em **Deployments**
   - Clique nos três pontos do deployment mais recente
   - Selecione **Redeploy**
   - Ou faça um novo commit/push para o GitHub

## Checklist

- [ ] `SUPABASE_URL` configurado ✅ (você já tem)
- [ ] `SUPABASE_ANON_KEY` configurado
- [ ] `JWT_SECRET` configurado (OBRIGATÓRIO)
- [ ] `DISCORD_CLIENT_ID` configurado
- [ ] `DISCORD_CLIENT_SECRET` configurado
- [ ] `DISCORD_REDIRECT_URI` configurado
- [ ] Novo deploy feito após adicionar as variáveis

## Onde Encontrar as Chaves

### Supabase ANON_KEY
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a chave "anon" ou "public"

### Discord OAuth
1. Acesse: https://discord.com/developers/applications
2. Selecione sua aplicação
3. Vá em **OAuth2**
4. Copie o **Client ID** e **Client Secret**
5. Em **Redirects**, adicione: `https://vye-v1.vercel.app/api/auth/discord/callback`

## Notas Importantes

- ⚠️ **JWT_SECRET é obrigatório** - Sem ele, o login Discord sempre vai dar erro 500
- ⚠️ **Variáveis SEM `VITE_` têm prioridade** nas serverless functions
- ⚠️ **Recomendação:** Configure AMBAS as versões (com e sem `VITE_`) para garantir compatibilidade
- ⚠️ **Após adicionar variáveis, sempre faça um novo deploy**

## Variáveis Opcionais

### Valorant API
- `HENRIKDEV_KEY` ou `VITE_HENRIKDEV_KEY`

### Pagamentos
- `VITE_MISTICPAY_CLIENT_ID` e `VITE_MISTICPAY_CLIENT_SECRET`
- Ou `VITE_VISIONWALLET_API_KEY`

