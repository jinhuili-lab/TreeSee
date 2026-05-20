# AGENTS.md

## Project
Protein Tree Studio for protein similarity tree, dendrogram, structural clustering tree, and domain-family tree visualization.

## Setup commands
- `cd frontend && npm install`
- `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

## Frontend commands
- `cd frontend && npm run dev`
- `cd frontend && npm run build`

## Backend commands
- `cd backend && uvicorn app.main:app --reload`

## Test commands
- `cd backend && pytest`

## Code style rules
- Prefer readable TypeScript/Python with modular functions.
- Keep comments only for non-obvious logic.
- Handle all parsing and matching errors with explicit messages.

## Scientific integrity rules
- Never silently change scientific data.
- Never silently drop unmatched leaf IDs or metadata IDs.
- Always report unmatched tree leaf IDs and unmatched metadata IDs.
- Preserve tree topology in all interactive operations.
- Collapse/expand is allowed; arbitrary topology editing is prohibited.


## Desktop launcher automation
- Root `build_project.bat` performs one-click build for frontend then desktop Tauri bundle, and copies final Windows exe to `bin/ProteinTreeStudio.exe`.
- Root `ClusterPro.bat` checks for `bin/ProteinTreeStudio.exe`; if missing, it auto-runs `build_project.bat`, then launches the desktop app.
- Future packaging option: wrap `ClusterPro.bat` into a standalone launcher executable using tools like Bat To Exe Converter.
- Scientific integrity remains mandatory: never silently alter tree topology or drop unmatched IDs.


## CI release packaging
- Use `.github/workflows/windows-desktop-release.yml` to build Windows desktop bundles in CI.
- Release artifacts should be produced in CI and distributed to users; avoid requiring end users to run npm/tauri build locally.
