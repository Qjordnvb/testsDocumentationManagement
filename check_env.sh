#!/bin/bash
# Simple script to check .env file and API key

echo "============================================================"
echo "DEBUG: Environment Configuration Check"
echo "============================================================"

# Check current directory
echo ""
echo "📁 Current directory: $(pwd)"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found at: $(pwd)/.env"
    echo ""

    # Check if GEMINI_API_KEY is in .env
    if grep -q "GEMINI_API_KEY" .env; then
        # Extract and mask the API key
        API_KEY=$(grep "GEMINI_API_KEY" .env | cut -d'=' -f2 | tr -d ' ')

        if [ -z "$API_KEY" ] || [ "$API_KEY" = "your_gemini_api_key_here" ]; then
            echo "❌ GEMINI_API_KEY is not set or has placeholder value"
        else
            # Mask the key for security
            KEY_LENGTH=${#API_KEY}
            MASKED_KEY="${API_KEY:0:10}...${API_KEY: -4}"

            echo "🔑 GEMINI_API_KEY found in .env"
            echo "   Masked value: $MASKED_KEY"
            echo "   Length: $KEY_LENGTH characters"

            # Check if it looks like a valid Google API key
            if [[ $API_KEY == AIza* ]]; then
                echo "   Format: ✅ Starts with 'AIza' (Google API key format)"
            else
                echo "   Format: ⚠️  Does NOT start with 'AIza' (unusual for Google keys)"
            fi
        fi
    else
        echo "❌ GEMINI_API_KEY not found in .env file"
    fi
else
    echo "❌ .env file NOT found at: $(pwd)/.env"
    echo ""
    echo "Expected location: $(pwd)/.env"
    echo ""
    echo "Did you create a .env file? Copy from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit and add your API key"
fi

echo ""
echo "============================================================"
echo "INSTRUCTIONS:"
echo "============================================================"
echo "1. Make sure you have a .env file in: $(pwd)"
echo "2. Add your API key: GEMINI_API_KEY=your_actual_key_here"
echo "3. Get a new API key at: https://aistudio.google.com/app/apikey"
echo "4. Restart the Python server after updating .env"
echo "============================================================"
