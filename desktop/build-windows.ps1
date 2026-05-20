Param(
  [switch]$Release = $true
)

$ErrorActionPreference = 'Stop'

Write-Host '== Protein Tree Studio Windows EXE build ==' -ForegroundColor Cyan

Push-Location $PSScriptRoot
try {
  Write-Host 'Installing desktop npm dependencies...' -ForegroundColor Yellow
  npm install

  Write-Host 'Building frontend assets...' -ForegroundColor Yellow
  Push-Location ../frontend
  npm install
  npm run build
  Pop-Location

  Write-Host 'Building Tauri Windows bundle (.exe)...' -ForegroundColor Yellow
  if ($Release) {
    npm run tauri:build
  } else {
    npm run tauri:dev
  }

  Write-Host 'Done. Check desktop/src-tauri/target/release/bundle/' -ForegroundColor Green
}
finally {
  Pop-Location
}
