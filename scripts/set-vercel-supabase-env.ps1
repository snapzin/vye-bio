$ErrorActionPreference = "Stop"

$SupabaseUrl = $env:SUPABASE_URL
$SupabaseAnonKey = $env:SUPABASE_ANON_KEY

if (-not $SupabaseUrl -or -not $SupabaseAnonKey) {
  Write-Host "Erro: defina SUPABASE_URL e SUPABASE_ANON_KEY no seu ambiente antes de rodar este script."
  Write-Host "Exemplo (PowerShell):"
  Write-Host '  $env:SUPABASE_URL="https://SEU_PROJETO.supabase.co"'
  Write-Host '  $env:SUPABASE_ANON_KEY="sb_publishable_..."'
  exit 1
}

$pairs = @(
  @{ Name = "SUPABASE_URL"; Value = $SupabaseUrl },
  @{ Name = "SUPABASE_ANON_KEY"; Value = $SupabaseAnonKey },
  @{ Name = "VITE_SUPABASE_URL"; Value = $SupabaseUrl },
  @{ Name = "VITE_SUPABASE_PUBLISHABLE_KEY"; Value = $SupabaseAnonKey }
)

$envs = @("production", "preview", "development")
$tmp = Join-Path $PSScriptRoot ".__vercel_env_tmp"

foreach ($env in $envs) {
  Write-Host "== Setting Supabase envs for $env =="
  foreach ($p in $pairs) {
    # Write without trailing newline to avoid Vercel storing CRLF
    Set-Content -Path $tmp -Value $p.Value -NoNewline -Encoding ascii
    cmd /c "type `"$tmp`" | vercel env add $($p.Name) $env --force" | Out-Host
  }
}

Remove-Item $tmp -Force -ErrorAction SilentlyContinue
Write-Host "Done."


