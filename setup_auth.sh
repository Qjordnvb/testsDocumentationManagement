#!/bin/bash
#
# Authentication System Setup Script
# Automates the initial setup for the authentication system
#

echo "============================================================"
echo "QA Documentation Automation - Authentication Setup"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Python version
echo "📋 Step 1: Checking Python version..."
python_version=$(python3 --version 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python found: $python_version${NC}"
else
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi
echo ""

# Step 3: Check .env file
echo "🔐 Step 3: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and set your SECRET_KEY${NC}"
    echo "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    echo ""
    echo "Press Enter after you've set the SECRET_KEY in .env, or Ctrl+C to exit..."
    read
fi

# Verify SECRET_KEY is set
if grep -q "your_secret_key_here" .env; then
    echo -e "${RED}❌ Please set a real SECRET_KEY in .env file${NC}"
    echo "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    exit 1
fi
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 4: Run database migration
echo "🗄️  Step 4: Adding users table to database..."
python3 add_users_table.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Users table created${NC}"
else
    echo -e "${RED}❌ Failed to create users table${NC}"
    exit 1
fi
echo ""

# Step 5: Seed admin user
echo "👤 Step 5: Creating initial admin user..."
python3 seed_admin_user.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Admin user created${NC}"
else
    echo -e "${YELLOW}⚠️  Admin user may already exist${NC}"
fi
echo ""

# Step 6: Final instructions
echo "============================================================"
echo -e "${GREEN}✅ AUTHENTICATION SETUP COMPLETED!${NC}"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Start the backend server:"
echo "   cd backend && python main.py"
echo ""
echo "2. Test the authentication:"
echo "   POST http://localhost:8000/api/v1/auth/login"
echo "   Body: {"
echo "     \"email\": \"admin@qa-system.com\","
echo "     \"password\": \"admin123\""
echo "   }"
echo ""
echo "3. IMPORTANT: Change the admin password immediately!"
echo "   PUT http://localhost:8000/api/v1/users/USR-001"
echo "   Body: { \"password\": \"your_new_secure_password\" }"
echo ""
echo "4. Documentation: See AUTH_SYSTEM.md for complete API reference"
echo ""
