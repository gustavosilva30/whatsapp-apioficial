@echo off
echo 🚀 Iniciando WhatsApp SaaS em modo local...

REM Configurações locais
set DATABASE_URL=postgres://postgres:Dourados1000@217.216.65.15:5432/crm-loja?sslmode=disable
set REDIS_URL=redis://default:w5q38zychxrhx1qtzeix@217.216.65.15:6379
set JWT_SECRET=local-dev-secret-key-change-in-production
set JWT_EXPIRES_IN=7d
set PORT=3000
set NODE_ENV=development
set CORS_ORIGIN=http://localhost:3000
set META_VERIFY_TOKEN=local_verify_token_123
set META_ACCESS_TOKEN=local_access_token_456

echo 📋 Configurações:
echo   - Database: VPS PostgreSQL
echo   - Redis: VPS Redis
echo   - Porta: 3000
echo   - Modo: Development
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo ⚠️ node_modules não encontrado. Instalando dependências...
    call npm install
)

REM Verificar se Prisma Client está gerado
if not exist "node_modules\.prisma\client" (
    echo ⚠️ Prisma Client não gerado. Gerando...
    call npx prisma generate
)

echo 🌐 O sistema estará disponível em:
echo   Frontend: http://localhost:3000
echo   API: http://localhost:3000/api/v1
echo   Health: http://localhost:3000/api/health
echo.

echo 📚 Rotas disponíveis:
echo   POST /api/v1/auth/login
echo   GET  /api/v1/auth/profile
echo   GET  /api/v1/channels
echo   GET  /api/v1/admin/stats ^(ADMIN^)
echo.

echo 🔧 Iniciando servidor com auto-reload...
echo   Press Ctrl+C to stop
echo.

call npm run dev
