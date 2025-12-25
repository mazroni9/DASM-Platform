@echo off
echo Starting DASM Platform Setup...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed! Please install Node.js first.
    pause
    exit /b 1
)

:: Check if PHP is installed
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo PHP is not installed! Please install PHP first.
    pause
    exit /b 1
)

:: Check if Composer is installed
where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo Composer is not installed! Please install Composer first.
    pause
    exit /b 1
)

:: Setup Frontend
echo Setting up Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies!
    pause
    exit /b 1
)

:: Setup Backend
echo Setting up Backend...
cd ..\backend
call composer install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies!
    pause
    exit /b 1
)

:: Copy .env file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo Created .env file from .env.example
)

:: Generate application key
call php artisan key:generate

:: Run database migrations
call php artisan migrate

:: Start the services
echo Starting services...
start cmd /k "cd ..\frontend && npm run dev"
start cmd /k "cd backend && php artisan serve"

echo DASM Platform is starting up!
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:8000
echo.
echo Press any key to stop all services...
pause >nul

:: Kill the running processes
taskkill /F /IM node.exe
taskkill /F /IM php.exe 