# Como Verificar os Logs no Vercel para Identificar o Erro

## Passo a Passo para Ver os Logs

### 1. Acesse o Deployment no Vercel
1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto `vye-v1`
3. Clique em **Deployments**

### 2. Encontre o Deployment Mais Recente
- Procure pelo deployment que foi feito após configurar as variáveis
- O deployment deve ter um status (Ready, Building, Error, etc.)

### 3. Acesse os Logs da Função
1. Clique no deployment mais recente
2. Clique na aba **Functions** (ou **Logs**)
3. Procure por `api/auth/discord/callback`
4. Clique na função para ver os logs detalhados

### 4. Procure por Erros Específicos
Nos logs, procure por:
- `JWT_SECRET não configurado`
- `Error creating JWT token`
- `Supabase credentials missing`
- `Discord credentials missing`
- `Error creating profile`
- Qualquer mensagem de erro em vermelho

## ID do Erro Atual
**ID:** `gru1::22nhw-1765909197218-4abd1a9c08ec`

Use este ID para encontrar o erro específico nos logs do Vercel.

## O Que Procurar nos Logs

### Se Ver "JWT_SECRET não configurado"
- Verifique se `JWT_SECRET` está configurado no Vercel
- Verifique se foi feito um novo deploy após adicionar

### Se Ver "Error creating JWT token"
- Verifique se `JWT_SECRET` tem um valor válido (não está vazio)
- Verifique se não está usando valor padrão inseguro

### Se Ver "Supabase credentials missing"
- Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão configurados
- Verifique se os valores estão corretos

### Se Ver "Discord credentials missing"
- Verifique se `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET` estão configurados
- Verifique se `DISCORD_REDIRECT_URI` está correto

### Se Ver "Error creating profile"
- Pode ser um problema com a estrutura da tabela no Supabase
- Verifique se a tabela `profiles` existe e tem as colunas corretas

## Envie os Logs

Depois de ver os logs, copie e cole aqui:
1. As últimas linhas de erro (geralmente em vermelho)
2. Qualquer mensagem que comece com "Error" ou "Failed"
3. A stack trace completa se houver

Isso vai ajudar a identificar exatamente o que está causando o erro 500.

