# AmbuSupply Installation Guide

## Quick Install

### For Mac/Linux:
\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`

### For Windows:
\`\`\`cmd
install.bat
\`\`\`

## Manual Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git (optional)

### Steps

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts  # Optional: sample data
   \`\`\`

4. **Start Application**
   \`\`\`bash
   npm run dev
   \`\`\`

## Configuration

### Required Environment Variables
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/ambusupply"
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### Optional Email Configuration
\`\`\`env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AmbuSupply <your-email@gmail.com>"
\`\`\`

## Default Login
- **Email:** admin@metroems.com
- **Password:** admin123

## Features
- 📊 **Dashboard:** Real-time operations overview
- 📦 **Inventory:** Medical supplies tracking
- 🚑 **Fleet:** Vehicle management
- 📋 **Orders:** Supply ordering workflow
- 🔔 **Notifications:** Real-time alerts
- 📧 **Email:** Password reset & notifications
- 👤 **Account:** User preferences

## Troubleshooting

### Database Issues
\`\`\`bash
# Reset database
npx prisma db push --force-reset
npx tsx prisma/seed.ts
\`\`\`

### Dependency Issues
\`\`\`bash
# Clean install
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Port Issues
\`\`\`bash
# Use different port
PORT=3001 npm run dev
\`\`\`

## Support
For issues or questions, check the application logs or review the configuration files.
