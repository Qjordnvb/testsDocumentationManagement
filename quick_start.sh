#!/bin/bash

echo "========================================="
echo "🧪 QA Documentation Automation"
echo "Quick Start Setup"
echo "========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi

echo "✓ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file and add your API keys!"
    echo "   Required: GEMINI_API_KEY"
    echo "   Optional: NOTION_API_KEY, AZURE_DEVOPS_PAT"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Initialize database
echo "🗄️  Initializing database..."
python -m src.cli init

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "2. Try parsing the example file:"
echo "   python -m src.cli parse ejemplo_user_stories.xlsx"
echo ""
echo "3. Generate test cases:"
echo "   python -m src.cli generate-tests US-001"
echo ""
echo "4. Start the web server:"
echo "   python -m src.cli server"
echo "   Then open: http://localhost:8000"
echo ""
echo "5. View all CLI commands:"
echo "   python -m src.cli --help"
echo ""
echo "========================================="
echo "Happy Testing! 🎉"
echo "========================================="
