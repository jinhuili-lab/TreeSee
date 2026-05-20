@echo off
setlocal
cd /d %~dp0

if not exist "bin\ProteinTreeStudio.exe" (
  echo First-time setup detected. Building desktop client...
  call "%~dp0build_project.bat"
  if errorlevel 1 (
    echo.
    echo Build failed.
    echo Common causes:
    echo   1) Rust/Cargo missing  (install via rustup)
    echo   2) Node/npm missing
    echo   3) Network restrictions when installing npm packages
    echo.
    echo See README Windows setup section for prerequisites.
    pause
    exit /b 1
  )
)

start "" "%~dp0bin\ProteinTreeStudio.exe"
exit /b 0
