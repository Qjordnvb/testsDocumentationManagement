@echo off
echo =========================================
echo QA Documentation Automation
echo Quick Start Setup - Windows
echo =========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed
    echo Please install Python 3.9 or higher
    pause
    exit /b 1
)

echo Python found
echo.

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

if errorlevel 1 (
    echo Failed to create virtual environment
    pause
    exit /b 1
)

echo Virtual environment created
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo .env file created
    echo.
    echo IMPORTANT: Edit the .env file and add your API keys!
    echo    Required: GEMINI_API_KEY
    echo    Optional: NOTION_API_KEY, AZURE_DEVOPS_PAT
    echo.
) else (
    echo .env file already exists
    echo.
)

REM Initialize database
echo Initializing database...
python -m src.cli init

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Next Steps:
echo.
echo 1. Edit .env file with your API keys
echo    notepad .env
echo.
echo 2. Try parsing the example file:
echo    python -m src.cli parse ejemplo_user_stories.xlsx
echo.
echo 3. Generate test cases:
echo    python -m src.cli generate-tests US-001
echo.
echo 4. Start the web server:
echo    python -m src.cli server
echo    Then open: http://localhost:8000
echo.
echo 5. View all CLI commands:
echo    python -m src.cli --help
echo.
echo =========================================
echo Happy Testing!
echo =========================================
pause
