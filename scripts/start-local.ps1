# Script para iniciar o sistema localmente para testes
# Execute: .\scripts\start-local.ps1

Write-Host "🚀 Iniciando WhatsApp SaaS em modo local..." -ForegroundColor Green

# Configurações locais
$env:DATABASE_URL = "postgres://postgres:Dourados1000@217.216.65.15:5432/crm-loja?sslmode=disable"
$env:REDIS_URL = "redis://default:w5q38zychxrhx1qtzeix@217.216.65.15:6379"
$env:JWT_SECRET = "local-dev-secret-key-change-in-production"
$env:JWT_EXPIRES_IN = "7d"
$env:PORT = "3000"
$env:NODE_ENV = "development"
$env:CORS_ORIGIN = "http://localhost:3000"
$env:META_VERIFY_TOKEN = "local_verify_token_123"
$env:META_ACCESS_TOKEN = "local_access_token_456"

Write-Host "📋 Configurações:" -ForegroundColor Cyan
Write-Host "  - Database: VPS PostgreSQL" -ForegroundColor Gray
Write-Host "  - Redis: VPS Redis" -ForegroundColor Gray
Write-Host "  - Porta: 3000" -ForegroundColor Gray
Write-Host "  - Modo: Development" -ForegroundColor Gray
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar se Prisma Client está gerado
if (-not (Test-Path "node_modules/.prisma/client")) {
    Write-Host "⚠️  Prisma Client não gerado. Gerando..." -ForegroundColor Yellow
    npx prisma generate
}

Write-Host "🌐 O sistema estará disponível em:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  API: http://localhost:3000/api/v1" -ForegroundColor Green
Write-Host "  Health: http://localhost:3000/api/health" -ForegroundColor Green
Write-Host ""

Write-Host "📚 Rotas disponíveis:" -ForegroundColor Cyan
Write-Host "  POST /api/v1/auth/login" -ForegroundColor Gray
Write-Host "  GET  /api/v1/auth/profile" -ForegroundColor Gray
Write-Host "  GET  /api/v1/channels" -ForegroundColor Gray
Write-Host "  GET  /api/v1/admin/stats (ADMIN)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Iniciando servidor com auto-reload..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
