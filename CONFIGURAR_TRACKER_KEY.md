# Configurar Nova Chave do Tracker (HENRIKDEV_KEY)

## Nova Chave Fornecida
```
HDEV-18e1067e-137f-4d8c-a234-8cd7c2ff5952
```

## Como Configurar no Vercel

1. Acesse o painel do Vercel: https://vercel.com/seu-projeto/settings/environment-variables

2. Adicione as seguintes variáveis de ambiente:

   **Para Serverless Functions (API routes):**
   - Nome: `HENRIKDEV_KEY`
   - Valor: `HDEV-18e1067e-137f-4d8c-a234-8cd7c2ff5952`
   - Ambientes: Production, Preview, Development

   **Para Frontend (opcional, mas recomendado):**
   - Nome: `VITE_HENRIKDEV_KEY`
   - Valor: `HDEV-18e1067e-137f-4d8c-a234-8cd7c2ff5952`
   - Ambientes: Production, Preview, Development

3. Após adicionar, faça um **Redeploy** do projeto:
   - Vá em **Deployments**
   - Clique nos três pontos do deployment mais recente
   - Selecione **Redeploy**

## Verificação

Após configurar e fazer redeploy, a API do Valorant deve funcionar corretamente com a nova chave.

## Nota

O código já está preparado para usar essa chave automaticamente. Apenas configure no Vercel e faça o redeploy.

