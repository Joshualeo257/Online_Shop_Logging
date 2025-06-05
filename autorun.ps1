# autorun.ps1

# Create virtual environment if it doesn't exist
if (-not (Test-Path -Path ".\venv")) {
    python -m venv venv
    Write-Host "Virtual environment created."
} else {
    Write-Host "Virtual environment already exists."
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
& .\venv\Scripts\Activate.ps1

# Install Python dependencies
Write-Host "Installing Python dependencies..."
pip install --upgrade pip
pip install flask flask-cors
pip install pymongo
pip install requests

# Start Node.js backend (Express server)
Write-Host "Starting Express server..."
Start-Process node -ArgumentList "server.js"

# Change to frontend folder
Set-Location -Path ".\frontend"

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
npm install

# Start React app
Write-Host "Starting React app..."
npm start


