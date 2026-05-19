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
