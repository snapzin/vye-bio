# Problemas Identificados no Login do Discord

## Erro: 500: INTERNAL_SERVER_ERROR

### Causas Raiz Identificadas:

#### 1. **JWT_SECRET não configurado na Vercel**
- **Problema**: O código em `api/auth/jwt.ts` (linha 10-16) exige que `JWT_SECRET` ou `VITE_JWT_SECRET` esteja configurado
- **Situação atual**: No `.env` local existe `VITE_JWT_SECRET="b3492bc3"`, mas as serverless functions na Vercel não têm acesso a variáveis com prefixo `VITE_`
- **Impacto**: Quando o callback do Discord tenta criar o JWT token (linha 262 em `callback.ts`), a função `createToken()` lança um erro porque `getJWTSecret()` não encontra a variável

#### 2. **Variáveis do Discord com prefixo VITE_**
- **Problema**: As funções serverless procuram por `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET` (sem prefixo)
- **Situação atual**: No `.env` existem apenas `VITE_DISCORD_CLIENT_ID` e `VITE_DISCORD_CLIENT_SECRET`
- **Código afetado**: 
  - `api/auth/discord.ts` linha 42
  - `api/auth/discord/callback.ts` linha 81-82
- **Mitigação parcial**: O código tem fallback para versões com `VITE_`, então funciona localmente mas pode falhar na Vercel

#### 3. **Supabase URL duplicada e incorreta**
- **Problema**: No `.env` há duas definições de `VITE_SUPABASE_URL`:
  - Linha 2: `"https://vye.vercel.app"` (INCORRETO - aponta para o próprio site)
  - Linha 4: `"https://eovsglkvefergfyardna.supabase.co"` (CORRETO)
- **Impacto**: Dependendo da ordem de leitura, pode usar a URL errada

#### 4. **Variáveis do Supabase também com prefixo VITE_**
- **Problema**: Similar ao Discord, as serverless functions procuram `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- **Código afetado**: `api/auth/discord/callback.ts` linha 85-86
- **Mitigação parcial**: Tem fallback, mas ideal é configurar sem prefixo na Vercel

### Solução:

1. Corrigir o arquivo `.env` local
2. Configurar as variáveis de ambiente na Vercel sem prefixo `VITE_`
3. Manter as versões com `VITE_` para o frontend React/Vite
