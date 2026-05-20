@echo off
setlocal enabledelayedexpansion

where cargo >nul 2>nul
if errorlevel 1 (
  echo ERROR: Rust/Cargo not found.
  echo Install Rust toolchain first: https://rustup.rs/
  echo Then restart terminal and rerun this script.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js 20+ first.
  exit /b 1
)

echo [1/4] Building frontend...
cd /d %~dp0frontend || exit /b 1
call npm install || exit /b 1
call npm run build || exit /b 1

echo [2/4] Building desktop (Tauri)...
cd /d %~dp0desktop || exit /b 1
call npm install || exit /b 1
call npm run tauri:build || exit /b 1

echo [3/4] Preparing bin directory...
cd /d %~dp0
if not exist bin mkdir bin

echo [4/4] Locating and copying generated .exe...
set "FOUND_EXE="
for /r "%~dp0desktop\src-tauri\target\release\bundle" %%F in (*.exe) do (
  set "FOUND_EXE=%%F"
  goto :copy_exe
)

echo ERROR: No .exe found under desktop\src-tauri\target\release\bundle\
exit /b 1

:copy_exe
copy /Y "%FOUND_EXE%" "%~dp0bin\ProteinTreeStudio.exe" >nul || exit /b 1

echo Build complete: bin\ProteinTreeStudio.exe
exit /b 0
