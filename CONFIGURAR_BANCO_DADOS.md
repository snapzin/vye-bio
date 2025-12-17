# ⚠️ Configurar Banco de Dados Supabase

## Status Atual

O código já está configurado para usar Supabase como banco de dados, mas **você precisa executar as migrations** para criar as tabelas e configurar as políticas RLS.

## Passo 1: Acessar o Supabase SQL Editor

1. Acesse o painel do seu projeto Supabase (o mesmo projeto configurado em `SUPABASE_URL`)
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**

## Passo 2: Executar as Migrations

Execute as migrations na seguinte ordem (copie e cole cada uma no SQL Editor):

### Migration 1: Tabela Base (OBRIGATÓRIA)
Execute o conteúdo do arquivo: `supabase/migrations/20251211235811_3f6cad84-23dc-4517-94f0-2854842c07fd.sql`

### Migration 2: Remover Dependências de Auth (OBRIGATÓRIA)
Execute o conteúdo do arquivo: `supabase/migrations/20251217000000_remove_auth_users_fk.sql`

### Migration 3: Remover Todas as Dependências de Auth (OBRIGATÓRIA)
Execute o conteúdo do arquivo: `supabase/migrations/20251218000003_remove_all_auth_dependencies.sql`

### Outras Migrations (Opcionais, mas Recomendadas)
Execute as outras migrations na ordem cronológica (por data):
- `20251212000000_add_music_autoplay.sql`
- `20251213000000_add_banner_url.sql`
- `20251213000001_add_avatar_shape.sql`
- `20251213000002_add_music_player_style.sql`
- `20251213000003_add_discord_user_id.sql`
- `20251213000004_add_is_admin.sql`
- ... (todas as outras)

## Passo 3: Verificar se Funcionou

Após executar as migrations, verifique se a tabela `profiles` existe:

```sql
SELECT * FROM profiles LIMIT 1;
```

Se não der erro, está tudo certo!

## Passo 4: Verificar Políticas RLS

Verifique se as políticas estão configuradas corretamente:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Você deve ver pelo menos estas políticas:
- "Profiles are publicly viewable" (SELECT)
- "Allow profile inserts" (INSERT)
- "Allow profile updates" (UPDATE)

## ⚠️ IMPORTANTE

As migrations **20251217000000_remove_auth_users_fk.sql** e **20251218000003_remove_all_auth_dependencies.sql** são **CRÍTICAS** porque:

1. Removem a dependência de `auth.users` (não usamos Supabase Auth)
2. Configuram as políticas RLS para permitir inserções/atualizações via API
3. Permitem que o código crie perfis diretamente na tabela `profiles`

**Sem essas migrations, o login Discord não vai funcionar!**

## Alternativa: Usar Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
supabase db push
```

Isso vai executar todas as migrations automaticamente.

