# PowerShell script to launch all Science Chatbot & Frontend services in ONE unified terminal

$root = $PSScriptRoot

# Detect virtual environment python if present
if (Test-Path "$root\.venv\Scripts\python.exe") {
    $python = "$root\.venv\Scripts\python.exe"
} else {
    $python = "python"
}

# Run single unified terminal multiplexer
& $python "$root\dev.py"

