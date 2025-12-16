# Diagnóstico do Erro 500 - Passo a Passo

## Erro Atual
- **ID:** `gru1::mfc49-1765909788611-85d59ab6896a`
- **Função:** `api/auth/discord/callback`
- **Status:** FUNCTION_INVOCATION_FAILED

## Como Verificar os Logs no Vercel

### 1. Acesse os Logs
1. Vá para: https://vercel.com/dashboard
2. Selecione o projeto `vye-v1`
3. Clique em **Deployments**
4. Selecione o deployment mais recente (que acabou de ser feito)
5. Clique na aba **Functions**
6. Procure por `api/auth/discord/callback`
7. Clique na função para ver os logs

### 2. O Que Procurar nos Logs

Procure por estas mensagens específicas:

#### Se Ver "Cannot find module" ou "MODULE_NOT_FOUND"
- Problema: Arquivos não estão sendo incluídos no build
- Solução: Verificar se `includeFiles` no vercel.json está correto

#### Se Ver "JWT_SECRET não configurado"
- Problema: Variável de ambiente não está configurada
- Solução: Verificar se `JWT_SECRET` está no Vercel

#### Se Ver "Error creating JWT token"
- Problema: Erro ao criar token
- Solução: Verificar se `JWT_SECRET` tem valor válido

#### Se Ver "Discord credentials missing"
- Problema: Credenciais do Discord não configuradas
- Solução: Verificar variáveis `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`

#### Se Ver "Supabase credentials missing"
- Problema: Credenciais do Supabase não configuradas
- Solução: Verificar variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`

#### Se Ver "Environment variables check"
- Isso é um log de debug que mostra quais variáveis estão configuradas
- Verifique se `hasJwtSecret: true`

### 3. Copie e Cole os Logs Aqui

Depois de ver os logs, copie e cole aqui:
- As últimas 20-30 linhas de log
- Qualquer mensagem de erro (geralmente em vermelho)
- A stack trace completa se houver

## Possíveis Problemas

### Problema 1: Arquivos não incluídos
Se os arquivos `jwt.ts`, `middleware/*`, `utils/*` não estão sendo incluídos, o erro será "Cannot find module".

### Problema 2: Variáveis de ambiente
Se as variáveis não estão configuradas, veremos mensagens específicas nos logs.

### Problema 3: Erro de sintaxe
Se houver erro de sintaxe no código, veremos a mensagem específica.

## Próximos Passos

1. **Verifique os logs** seguindo os passos acima
2. **Copie e cole os logs aqui** para análise
3. **Verifique se as variáveis de ambiente estão configuradas** no Vercel
4. **Aguarde o novo deployment** após as correções

