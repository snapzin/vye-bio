# ⚠️ CORREÇÃO: Erro invalid_client no Discord OAuth

## Problema

O erro `invalid_client` (401) significa que o Discord não reconhece o `client_id` ou `client_secret`.

## Possíveis Causas

1. **Valores incorretos** no Vercel
2. **Espaços ou caracteres extras** nas variáveis (como aconteceu com `DISCORD_REDIRECT_URI`)
3. **Client Secret regenerado** no Discord Developer Portal mas não atualizado no Vercel
4. **Valores vazios** ou undefined

## Solução: Verificar e Corrigir no Vercel

### Passo 1: Verificar no Discord Developer Portal

1. Acesse: https://discord.com/developers/applications
2. Selecione sua aplicação
3. Vá em **OAuth2**
4. Anote:
   - **Client ID** (não é secreto)
   - **Client Secret** (clique em "Reset Secret" se necessário, mas isso vai invalidar o secret antigo)

### Passo 2: Verificar no Vercel

1. Acesse: https://vercel.com/snapzin/vye-v1/settings/environment-variables
2. Verifique `DISCORD_CLIENT_ID`:
   - Deve ser exatamente igual ao Client ID do Discord
   - **SEM espaços** no início ou fim
   - **SEM aspas** (se tiver aspas, remova)
3. Verifique `DISCORD_CLIENT_SECRET`:
   - Deve ser exatamente igual ao Client Secret do Discord
   - **SEM espaços** no início ou fim
   - **SEM aspas** (se tiver aspas, remova)

### Passo 3: Corrigir se Necessário

Se encontrar espaços ou caracteres extras:

1. **Remova** a variável atual
2. **Adicione novamente** com o valor correto:
   - Copie o valor do Discord Developer Portal
   - Cole no Vercel **SEM espaços extras**
   - **SEM aspas** ao redor do valor
3. Marque para: **Production**, **Preview**, **Development**

### Passo 4: Verificar Redirect URI no Discord

Certifique-se de que o Redirect URI no Discord está configurado:
```
https://vye-v1.vercel.app/api/auth/discord/callback
```

### Passo 5: Fazer Redeploy

Após corrigir, faça um novo deploy ou aguarde o próximo commit.

## Verificação

Após corrigir, os logs do Vercel devem mostrar:
- `clientIdLength`: deve ser um número (geralmente 18 dígitos para Discord)
- `clientSecretLength`: deve ser um número (geralmente 32 caracteres)
- `clientIdHasSpaces`: deve ser `false`
- `clientSecretHasSpaces`: deve ser `false`

## Nota Importante

Se você regenerou o Client Secret no Discord:
1. **TODOS** os lugares que usam o secret antigo vão parar de funcionar
2. Você **DEVE** atualizar no Vercel imediatamente
3. O secret antigo não funciona mais

