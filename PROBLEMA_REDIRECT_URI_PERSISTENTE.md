# Problema: Redirect URI Ainda Incorreto

## Observação

Mesmo após atualizar a variável `DISCORD_REDIRECT_URI` na Vercel, o site ainda está usando a URL antiga:

**URL sendo usada (incorreta):**
```
https://vye-v1-pb2skd6xy-snapzins-projects.vercel.app/api/auth/discord/callback
```

**URL que deveria ser usada (correta):**
```
https://vye-v1.vercel.app/api/auth/discord/callback
```

## Causa Raiz

O problema está no **código fonte** do arquivo `/api/auth/discord.ts`. Ele está construindo a URL do redirect_uri dinamicamente usando `req.headers.host`, que retorna o domínio do deployment específico em vez do domínio principal.

## Solução

Precisamos modificar o código para usar a variável de ambiente `DISCORD_REDIRECT_URI` diretamente, em vez de construir dinamicamente.

### Arquivo a Modificar

`/api/auth/discord.ts`

### Mudança Necessária

**Antes (código atual):**
```typescript
const redirectUri = `https://${req.headers.host}/api/auth/discord/callback`;
```

**Depois (código corrigido):**
```typescript
const redirectUri = process.env.DISCORD_REDIRECT_URI || `https://${req.headers.host}/api/auth/discord/callback`;
```

Ou melhor ainda, usar diretamente a variável:
```typescript
const redirectUri = process.env.DISCORD_REDIRECT_URI;
```
