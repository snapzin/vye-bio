# Correção do Erro 500 - Serverless Function Crash

## Problema Identificado

O erro 500 (`FUNCTION_INVOCATION_FAILED`) estava ocorrendo quando:
1. A variável de ambiente `JWT_SECRET` não estava configurada no Vercel
2. Erros não tratados estavam causando crashes nas funções serverless
3. Mensagens de erro não eram claras o suficiente para identificar o problema

## Correções Implementadas

### 1. Tratamento de Erros JWT_SECRET
- Adicionado tratamento específico para erros relacionados a `JWT_SECRET` em todas as funções serverless
- Mensagens de erro claras indicando que `JWT_SECRET` precisa ser configurado
- Logs detalhados para facilitar o debug

### 2. Melhorias em `api/auth/index.ts`
- Tratamento de erros ao criar tokens JWT (login e registro)
- Tratamento de erros ao verificar tokens (session)
- Logs detalhados de erros para debug

### 3. Melhorias em `api/auth/discord/callback.ts`
- Tratamento específico de erros de JWT_SECRET
- Retorno de JSON em vez de redirect quando há erro crítico
- Logs detalhados de erros

### 4. Melhorias em `api/middleware/auth.ts`
- Tratamento de erros na autenticação
- Relançamento de erros de JWT_SECRET para serem capturados pelo handler

### 5. Melhorias em `api/data/index.ts` e `api/admin/index.ts`
- Tratamento específico de erros de JWT_SECRET
- Logs detalhados de erros

## Como Verificar se o Problema Foi Resolvido

### 1. Verificar Variáveis de Ambiente no Vercel

Acesse o painel do Vercel e verifique se as seguintes variáveis estão configuradas:

**Obrigatórias:**
- `JWT_SECRET` - Chave secreta para assinar tokens JWT (gere com `openssl rand -hex 32`)
- `SUPABASE_URL` ou `VITE_SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave pública do Supabase

**Para autenticação Discord:**
- `DISCORD_CLIENT_ID` ou `VITE_DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET` ou `VITE_DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI` ou `VITE_DISCORD_REDIRECT_URI`

### 2. Verificar Logs no Vercel

1. Acesse o painel do Vercel
2. Vá em **Deployments** > Selecione o deployment mais recente
3. Clique em **Functions** > Selecione a função que está falhando
4. Verifique os logs para ver mensagens de erro específicas

### 3. Testar as Funções

Após configurar as variáveis de ambiente:

1. Faça um novo deploy no Vercel
2. Teste as rotas da API:
   - `/api/auth` (POST com action: login, register ou session)
   - `/api/auth/discord` (GET para iniciar OAuth)
   - `/api/auth/discord/callback` (GET - callback do Discord)

### 4. Mensagens de Erro Esperadas

Agora, em vez de um erro 500 genérico, você verá mensagens específicas:

**Se JWT_SECRET não estiver configurado:**
```json
{
  "error": "JWT_SECRET não configurado",
  "details": "Configure a variável de ambiente JWT_SECRET no Vercel"
}
```

**Se Supabase não estiver configurado:**
```json
{
  "error": "Supabase not configured"
}
```

**Se Discord não estiver configurado:**
```json
{
  "error": "Discord credentials not configured"
}
```

## Próximos Passos

1. **Configure todas as variáveis de ambiente necessárias no Vercel**
2. **Faça um novo deploy**
3. **Teste as funções serverless**
4. **Verifique os logs se ainda houver problemas**

## Geração de JWT_SECRET

Para gerar uma chave JWT_SECRET segura, execute:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Ou use um gerador online de chaves aleatórias.

## Notas Importantes

- **NÃO** use valores padrão como "your-secret-key-change-in-production"
- **NÃO** compartilhe o JWT_SECRET publicamente
- Use uma chave diferente para cada ambiente (desenvolvimento, produção)
- A chave deve ter pelo menos 32 caracteres

