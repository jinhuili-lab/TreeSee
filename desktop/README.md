# Desktop Client (Tauri) - MVP Scaffold

This directory contains a desktop wrapper scaffold for Protein Tree Studio.

## Goals of this phase
- Keep the existing React frontend as primary UI.
- Prepare a Tauri desktop shell for cross-platform distribution.
- Enable future local file open/save and native menu integration.

## Prerequisites
- Rust toolchain
- Tauri system dependencies (platform-specific)
- Node.js/npm

## Dev workflow (when dependencies are available)
```bash
cd frontend
npm install
npm run build

cd ../desktop
npm install
npm run tauri:dev
```

## Notes
- In this repo environment, network/package restrictions may block installing Tauri deps.
- This scaffold is committed so local/dev machines can continue with standard Tauri setup.
