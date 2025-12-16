# Solução para Erro 500 no Login Discord

## Problema
O erro 500 está ocorrendo no callback do Discord (`/api/auth/discord/callback`) após autorizar no Discord.

## Causas Mais Comuns

### 1. JWT_SECRET não configurado ⚠️ (MAIS PROVÁVEL)
A variável de ambiente `JWT_SECRET` é **obrigatória** e causa crash se não estiver configurada.

**Solução:**
1. Acesse o painel do Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione a variável:
   - **Nome:** `JWT_SECRET`
   - **Valor:** Gere uma chave segura (veja abaixo)
   - **Ambiente:** Production, Preview, Development

**Como gerar JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2. Variáveis de ambiente não configuradas
Verifique se TODAS estas variáveis estão configuradas no Vercel:

**Obrigatórias:**
- `JWT_SECRET` - Chave secreta para JWT
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave pública do Supabase
- `DISCORD_CLIENT_ID` - ID do cliente Discord
- `DISCORD_CLIENT_SECRET` - Secret do cliente Discord
- `DISCORD_REDIRECT_URI` - URL de callback (ex: `https://vye-v1.vercel.app/api/auth/discord/callback`)

### 3. Deploy não atualizado
Após adicionar as variáveis de ambiente, você **DEVE** fazer um novo deploy.

**Solução:**
1. No Vercel, vá em **Deployments**
2. Clique nos três pontos do deployment mais recente
3. Selecione **Redeploy**
4. Ou faça um novo commit e push para o GitHub

## Como Verificar os Logs

1. Acesse o painel do Vercel
2. Vá em **Deployments** > Selecione o deployment mais recente
3. Clique em **Functions**
4. Selecione `api/auth/discord/callback`
5. Veja os logs para identificar o erro específico

## Mensagens de Erro Esperadas

Agora, em vez de erro 500 genérico, você verá mensagens específicas:

**Se JWT_SECRET não estiver configurado:**
```json
{
  "error": "JWT_SECRET não configurado",
  "details": "Configure a variável de ambiente JWT_SECRET no Vercel"
}
```

**Se Discord não estiver configurado:**
```json
{
  "error": "Discord credentials not configured",
  "details": "Configure DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in Vercel"
}
```

**Se Supabase não estiver configurado:**
```json
{
  "error": "Supabase not configured",
  "details": "Configure SUPABASE_URL and SUPABASE_ANON_KEY in Vercel"
}
```

## Checklist de Verificação

- [ ] `JWT_SECRET` configurado no Vercel
- [ ] `SUPABASE_URL` configurado no Vercel
- [ ] `SUPABASE_ANON_KEY` configurado no Vercel
- [ ] `DISCORD_CLIENT_ID` configurado no Vercel
- [ ] `DISCORD_CLIENT_SECRET` configurado no Vercel
- [ ] `DISCORD_REDIRECT_URI` configurado no Vercel (deve ser exatamente: `https://vye-v1.vercel.app/api/auth/discord/callback`)
- [ ] Novo deploy feito após adicionar as variáveis
- [ ] Logs verificados no Vercel para identificar erros específicos

## Próximos Passos

1. **Configure todas as variáveis de ambiente** (especialmente `JWT_SECRET`)
2. **Faça um novo deploy** no Vercel
3. **Teste o login com Discord novamente**
4. **Verifique os logs** se ainda houver problemas

## Notas Importantes

- ⚠️ **JWT_SECRET é obrigatório** - Sem ele, a função sempre vai crashar
- ⚠️ **Variáveis SEM `VITE_` têm prioridade** nas serverless functions
- ⚠️ **Recomendação:** Configure AMBAS as versões (com e sem `VITE_`) para garantir compatibilidade
- ⚠️ **Após adicionar variáveis, sempre faça um novo deploy**

