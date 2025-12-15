# Script para configurar variáveis de ambiente no Vercel
# Execute: .\setup-vercel-env.ps1

Write-Host "=== Configuração de Variáveis de Ambiente no Vercel ===" -ForegroundColor Cyan
Write-Host ""

# Verifica se está logado
Write-Host "Verificando se você está logado no Vercel..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Você precisa fazer login no Vercel primeiro!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute este comando para fazer login:" -ForegroundColor Yellow
    Write-Host "  vercel login" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "Logado como: $loginCheck" -ForegroundColor Green
Write-Host ""

# JWT_SECRET
$jwtSecret = "YrUxe0mMw37hx1YhWS562OXNjpRUSszwgnDwhk0su7Y6c2w8PPjrrPf15MjnxGSiwON7ri7EzX0MNciFfKzFDu"

Write-Host "Configurando JWT_SECRET..." -ForegroundColor Yellow
vercel env add JWT_SECRET production preview development <<< $jwtSecret

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ JWT_SECRET configurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao configurar JWT_SECRET" -ForegroundColor Red
    Write-Host "Você pode configurar manualmente executando:" -ForegroundColor Yellow
    Write-Host "  vercel env add JWT_SECRET" -ForegroundColor White
    Write-Host "E então colar o valor quando solicitado: $jwtSecret" -ForegroundColor White
}

Write-Host ""
Write-Host "Para adicionar outras variáveis de ambiente:" -ForegroundColor Cyan
Write-Host "  vercel env add NOME_DA_VARIAVEL production preview development" -ForegroundColor White
Write-Host ""
Write-Host "Para listar todas as variáveis:" -ForegroundColor Cyan
Write-Host "  vercel env ls" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Após adicionar as variáveis, você precisa fazer um redeploy!" -ForegroundColor Yellow

