# ⚠️ URGENTE: Verificar Variáveis de Ambiente no Vercel

## O erro 500 persiste porque as variáveis de ambiente NÃO estão configuradas no Vercel!

### 🔴 AÇÃO IMEDIATA NECESSÁRIA:

1. **Acesse o painel do Vercel:**
   - Vá para: https://vercel.com/snapzin/vye-v1/settings/environment-variables

2. **Configure estas variáveis OBRIGATÓRIAS:**

```
JWT_SECRET=GERAR_UMA_CHAVE_FORTE_E_UNICA
```

```
DISCORD_CLIENT_ID=SEU_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=SEU_DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=https://vye-v1.vercel.app/api/auth/discord/callback
```

```
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=<sua-chave-aqui>
```

3. **IMPORTANTE:**
   - Marque TODAS as variáveis para: **Production**, **Preview**, **Development**
   - Após adicionar, clique em **"Redeploy"** no último deployment
   - OU faça um novo commit para triggerar um novo deploy

### 🔍 Como verificar se está configurado:

1. Vá para: https://vercel.com/snapzin/vye-v1/settings/environment-variables
2. Verifique se `JWT_SECRET` aparece na lista
3. Se não aparecer, **ADICIONE AGORA!**

### 📝 Nota:

O código está correto. O problema é que o Vercel não tem acesso às variáveis de ambiente. Elas precisam ser configuradas manualmente no painel do Vercel.

