#!/bin/bash

# AmbuSupply Installation Script
# This script sets up the AmbuSupply EMS management system

set -e  # Exit on any error

echo "🚑 AmbuSupply Installation Script"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before continuing."
    echo "   Required variables:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - JWT_SECRET (random secure string)"
    echo "   - NEXT_PUBLIC_APP_URL (your app URL, e.g., http://localhost:3000)"
    echo ""
    echo "   Optional email variables (for notifications and password reset):"
    echo "   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Generate Prisma client
echo "🗄️  Setting up database..."
npx prisma generate

# Check if database is accessible
echo "🔍 Checking database connection..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema applied successfully"
else
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    exit 1
fi

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
if [ -f "prisma/seed.ts" ]; then
    npx tsx prisma/seed.ts
    echo "✅ Database seeded successfully"
else
    echo "⚠️  No seed file found, skipping database seeding"
fi

# Create startup script
echo "📝 Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚑 Starting AmbuSupply..."
npm run dev
EOF
chmod +x start.sh

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. Review your .env configuration"
echo "2. Start the application: ./start.sh or npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Login with: admin@metroems.com / admin123"
echo ""
echo "📚 Documentation:"
echo "- Dashboard: Real-time EMS operations overview"
echo "- Inventory: Medical supplies and equipment tracking"
echo "- Fleet: Ambulance and vehicle management"
echo "- Orders: Supply ordering and approval workflow"
echo "- Account: User settings and email preferences"
echo ""
echo "🔧 Troubleshooting:"
echo "- Check logs: npm run dev"
echo "- Reset database: npx prisma db push --force-reset"
echo "- Reinstall: rm -rf node_modules && npm install"
