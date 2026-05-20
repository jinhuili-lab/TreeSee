@echo off
setlocal
cd /d %~dp0
call npm install
cd ..\frontend
call npm install
cd ..\desktop
call npm run tauri:dev
endlocal
