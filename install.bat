@echo off
setlocal enabledelayedexpansion

echo 🚑 AmbuSupply Installation Script
echo =================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️  Creating environment file...
    copy .env.example .env
    echo 📝 Please edit .env file with your configuration before continuing.
    echo    Required variables:
    echo    - DATABASE_URL (PostgreSQL connection string^)
    echo    - JWT_SECRET (random secure string^)
    echo    - NEXT_PUBLIC_APP_URL (your app URL, e.g., http://localhost:3000^)
    echo.
    echo    Optional email variables (for notifications and password reset^):
    echo    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
    echo.
    pause
)

REM Generate Prisma client
echo 🗄️  Setting up database...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

REM Apply database schema
echo 🔍 Applying database schema...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo ❌ Database connection failed. Please check your DATABASE_URL in .env
    pause
    exit /b 1
)

echo ✅ Database schema applied successfully

REM Seed database
echo 🌱 Seeding database with sample data...
if exist "prisma\seed.ts" (
    call npx tsx prisma/seed.ts
    echo ✅ Database seeded successfully
) else (
    echo ⚠️  No seed file found, skipping database seeding
)

REM Create startup script
echo 📝 Creating startup script...
echo @echo off > start.bat
echo echo 🚑 Starting AmbuSupply... >> start.bat
echo npm run dev >> start.bat

echo.
echo 🎉 Installation Complete!
echo ========================
echo.
echo 📋 Next Steps:
echo 1. Review your .env configuration
echo 2. Start the application: start.bat or npm run dev
echo 3. Open http://localhost:3000 in your browser
echo 4. Login with: admin@metroems.com / admin123
echo.
echo 📚 Documentation:
echo - Dashboard: Real-time EMS operations overview
echo - Inventory: Medical supplies and equipment tracking
echo - Fleet: Ambulance and vehicle management
echo - Orders: Supply ordering and approval workflow
echo - Account: User settings and email preferences
echo.
echo 🔧 Troubleshooting:
echo - Check logs: npm run dev
echo - Reset database: npx prisma db push --force-reset
echo - Reinstall: rmdir /s node_modules ^&^& npm install

pause
