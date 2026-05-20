@echo off
setlocal
cd /d %~dp0

if not exist "bin\ProteinTreeStudio.exe" (
  echo First-time setup detected. Building desktop client...
  call "%~dp0build_project.bat"
  if errorlevel 1 (
    echo Build failed. Please review output above.
    pause
    exit /b 1
  )
)

start "" "%~dp0bin\ProteinTreeStudio.exe"
exit /b 0
