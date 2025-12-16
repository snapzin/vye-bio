# Solução para Limite de 12 Funções Serverless no Plano Hobby

## Problema
O Vercel Hobby plan tem limite de **12 funções serverless** por deployment. O projeto está excedendo esse limite porque está contando arquivos que não são endpoints.

## Funções Serverless Reais (6 total)
1. `api/auth/index.ts` - Autenticação (login, register, session)
2. `api/auth/discord.ts` - Iniciar OAuth Discord
3. `api/auth/discord/callback.ts` - Callback OAuth Discord
4. `api/data/index.ts` - Gerenciar dados do usuário
5. `api/admin/index.ts` - Operações admin
6. `api/valorant.ts` - API Valorant

**Total: 6 funções** (dentro do limite de 12)

## Arquivos que NÃO são funções serverless
Estes arquivos são módulos/utilitários e devem ser ignorados pelo Vercel:
- `api/middleware/*` - Middleware (não são endpoints)
- `api/utils/*` - Utilitários (não são endpoints)
- `api/auth/jwt.ts` - Módulo JWT (não é endpoint)

## Solução

O `.vercelignore` precisa ignorar esses arquivos para que não sejam contados como funções serverless, mas eles ainda serão incluídos como dependências quando importados pelas funções reais.

