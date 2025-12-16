# Correção dos Erros TypeScript

## Erros Identificados

1. **`Cannot find module '../_lib/jwt'`** - Linha 6
   - **Solução:** Adicionar extensão `.js` no import: `import { createToken } from '../_lib/jwt.js';`

2. **`Cannot find name 'JWT_SECRET'`** - Linha 125
   - **Problema:** A variável `JWT_SECRET` não foi declarada antes de ser usada
   - **Solução:** Adicionar declaração após linha 93:
     ```typescript
     const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
     ```

## Correções Necessárias

### 1. Corrigir Import (Linha 6)
```typescript
// Antes:
import { createToken } from '../_lib/jwt';

// Depois:
import { createToken } from '../_lib/jwt.js';
```

### 2. Adicionar Declaração de JWT_SECRET (Após linha 93)
```typescript
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Verificar JWT_SECRET também
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
```

### 3. Corrigir Indentação (Linha 95)
A linha 95 tem indentação incorreta (2 espaços em vez de 4). Deve ser:
```typescript
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
```

## Status
- ✅ Import corrigido (extensão .js adicionada)
- ⚠️ JWT_SECRET ainda precisa ser declarado
- ⚠️ Indentação da linha 95 precisa ser corrigida

