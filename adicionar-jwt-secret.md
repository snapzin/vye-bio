# Como Adicionar JWT_SECRET no Vercel via CLI

## Passo 1: Fazer Login
```powershell
vercel login
```
Siga as instruções na tela para fazer login.

## Passo 2: Adicionar JWT_SECRET

Após fazer login, execute este comando:

```powershell
vercel env add JWT_SECRET production preview development
```

Quando solicitado, cole este valor:
```
YrUxe0mMw37hx1YhWS562OXNjpRUSszwgnDwhk0su7Y6c2w8PPjrrPf15MjnxGSiwON7ri7EzX0MNciFfKzFDu
```

## Alternativa: Usar Echo (Automático)

No PowerShell, você pode usar:

```powershell
"YrUxe0mMw37hx1YhWS562OXNjpRUSszwgnDwhk0su7Y6c2w8PPjrrPf15MjnxGSiwON7ri7EzX0MNciFfKzFDu" | vercel env add JWT_SECRET production preview development
```

## Passo 3: Verificar se foi adicionado

```powershell
vercel env ls
```

Você deve ver `JWT_SECRET` na lista.

## Passo 4: Fazer Redeploy

Após adicionar a variável, você precisa fazer um redeploy:
- Vá no painel do Vercel → Deployments → Clique nos 3 pontos do último deployment → Redeploy

OU

- Faça um novo commit no Git para trigger um novo deployment automaticamente

