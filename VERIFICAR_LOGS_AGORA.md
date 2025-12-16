# ⚠️ URGENTE: Verificar Logs do Vercel

O erro 500 ainda está acontecendo. Preciso que você verifique os logs para identificar o problema específico.

## Como Verificar os Logs

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione** o projeto `vye-v1`
3. **Vá em Deployments** > Selecione o deployment mais recente
4. **Clique em Functions**
5. **Selecione** `api/auth/discord/callback`
6. **Veja os logs** e copie as mensagens de erro

## O Que Procurar

Procure por estas mensagens específicas:

### "Cannot find module" ou "MODULE_NOT_FOUND"
- **Problema:** Arquivos em `lib/` não estão sendo encontrados
- **Solução:** Ajustar imports ou configuração

### "JWT_SECRET não configurado"
- **Problema:** Variável de ambiente não configurada
- **Solução:** Verificar se `JWT_SECRET` está no Vercel

### "Error creating JWT token"
- **Problema:** Erro ao criar token
- **Solução:** Verificar `JWT_SECRET`

### "Environment variables check"
- Isso mostra quais variáveis estão configuradas
- Verifique se `hasJwtSecret: true`

## Copie e Cole os Logs Aqui

Depois de ver os logs, copie e cole aqui:
- **Últimas 30-50 linhas de log**
- **Qualquer mensagem de erro** (geralmente em vermelho)
- **Stack trace completa** se houver

Com os logs, posso identificar exatamente o que está causando o erro 500.

