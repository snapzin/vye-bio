# Análise: Quebra de Linha Ainda Presente na URL

## Problema Identificado

Mesmo após reconfigurar a variável `DISCORD_REDIRECT_URI` na Vercel usando `printf` (sem quebra de linha), a URL gerada pelo código ainda contém `%250A` (quebra de linha codificada).

## URL Atual (com problema)

```
https://discord.com/login?redirect_to=%2Foauth2%2Fauthorize%3Fclient_id%3D1442598539770466540%250A%26redirect_uri%3Dhttps%253A%252F%252Fvye-v1.vercel.app%252Fapi%252Fauth%252Fdiscord%252Fcallback%26response_type%3Dcode%26scope%3Didentify%2Bemail%26state%3Dyl9iayvp72lps4jn5rpdi
```

Observe o `%250A` após o `client_id`.

## Análise

O problema NÃO está na variável `DISCORD_REDIRECT_URI`, mas sim na variável `DISCORD_CLIENT_ID`!

Olhando a URL, vemos:
```
client_id=1442598539770466540%250A
```

Isso significa que a variável `DISCORD_CLIENT_ID` tem uma quebra de linha no final!

## Causa Raiz

Quando adicionamos as variáveis usando `echo`, o comando adiciona automaticamente uma quebra de linha (`\n`) no final. Exemplo:

```bash
echo "144259853977046654" | vercel env add DISCORD_CLIENT_ID production
```

Isso resulta em: `144259853977046654\n`

## Solução

Precisamos remover e recriar TODAS as variáveis que foram adicionadas com `echo`, usando `printf` em vez disso:

1. `DISCORD_CLIENT_ID`
2. `DISCORD_CLIENT_SECRET`
3. `JWT_SECRET`
4. `SUPABASE_URL`
5. `SUPABASE_ANON_KEY`
6. `SUPABASE_PUBLISHABLE_KEY`

## Ação Necessária

Remover e recriar todas as variáveis de ambiente usando `printf` para evitar quebras de linha.
