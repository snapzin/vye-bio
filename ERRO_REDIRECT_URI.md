# Erro: redirect_uri de OAuth2 Inválido

## Problema Identificado

Ao clicar em "Continuar com Discord", o Discord retorna o erro:

```
redirect_uri de OAuth2 inválido
```

## Causa

O `redirect_uri` que está sendo enviado para o Discord não está registrado no **Discord Developer Portal** como uma URL autorizada para a aplicação.

## URL Atual Sendo Usada

Observando a URL na barra de endereços do navegador:
```
https://discord.com/oauth2/authorize?client_id=1442598539770466540&redirect_uri=https%3A%2F%2Fvye-v1-pb2skd6xy-snapzins-projects.vercel.app%2Fapi%2Fauth%2Fdiscord%2Fcallback
```

Decodificando o `redirect_uri`:
```
https://vye-v1-pb2skd6xy-snapzins-projects.vercel.app/api/auth/discord/callback
```

## Problema

Esta URL é de um **deployment específico** (vye-v1-pb2skd6xy), mas o domínio principal de produção é:
```
https://vye-v1.vercel.app
```

## Solução

Precisamos atualizar o `DISCORD_REDIRECT_URI` na Vercel para usar o domínio principal:

**Valor Correto:**
```
https://vye-v1.vercel.app/api/auth/discord/callback
```

**E também registrar esta URL no Discord Developer Portal:**

1. Acessar: https://discord.com/developers/applications/1442598539770466540/oauth2
2. Em "Redirects", adicionar:
   - `https://vye-v1.vercel.app/api/auth/discord/callback`
3. Salvar as alterações
