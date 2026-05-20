# Protein Tree Studio

## Project overview
Protein Tree Studio is a web-based scientific visualization MVP for protein similarity trees, hierarchical clustering trees, structural clustering trees, and domain-family trees.

## Scientific motivation
Researchers often need one practical tool for exploring structure/embedding/sequence-derived trees with metadata overlays. This project provides an interactive SVG-based interface focused on correctness and publication-friendly export.

## Supported tree types
- Protein similarity tree
- Structural clustering tree
- Domain-family tree
- Generic dendrogram / hierarchical clustering tree
- Sequence-based phylogenetic-like tree (treated as general tree input)

## Monorepo structure
- `frontend/`: React + TypeScript + Vite + D3 UI
- `backend/`: FastAPI APIs (metadata parser and Newick parser implemented in-repo for offline resilience)
- `examples/`: sample Newick and metadata files
- `docs/`: documentation workspace

## Installation
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Development commands
- Frontend build: `cd frontend && npm run build`
- Backend tests: `cd backend && pytest`

## Example workflow
1. Start backend at `http://localhost:8000`.
2. Start frontend with Vite.
3. Load default example tree.
4. Upload your Newick and metadata files.
5. Search leaf labels and inspect metadata.
6. Color leaves by metadata columns.
7. Collapse or expand clades.
8. Export SVG for publication editing.
9. Save/load UI state as JSON via local storage.

## Input formats
### Newick
```newick
((ProteinA:0.1,ProteinB:0.2)Node1:0.3,(ProteinC:0.2,ProteinD:0.4)Node2:0.5)Root;
```

### Metadata CSV/TSV
Required `id` column must match tree leaf names.

## Current limitations
- Metadata upload-to-render integration in UI is partial in this MVP; full pairing endpoint exists in backend (`/api/match`).
- Radial layout is not yet implemented (TODO).
- PDF export is TODO; recommended path: render SVG server-side with CairoSVG or client-side convert via svg2pdf.js + jsPDF.

## Roadmap
- Full frontend metadata matching flow using `/api/match`
- Radial/circular tree rendering mode
- Metadata strip scaling improvements for numeric columns
- Better legends and publication presets
- Multi-track metadata panel and batch figure export


## Dependency installation fallback (GitHub)
If `pip install -r requirements.txt` fails due package-index restrictions, use GitHub sources for key packages:
```bash
cd backend
pip install "git+https://github.com/fastapi/fastapi.git@0.115.0"
pip install "git+https://github.com/encode/starlette.git@0.38.6"
pip install "git+https://github.com/pydantic/pydantic.git@v2.9.2"
pip install "git+https://github.com/encode/uvicorn.git@0.30.6"
pip install -r requirements.txt
```
This fallback is mainly for environments where PyPI is blocked but GitHub remains reachable.


## Desktop client (planned / scaffolded)
A Tauri desktop scaffold is included under `desktop/` to support future cross-platform packaging while reusing the web UI core.

Planned next steps:
- Native file open/save dialogs
- Native application menu wiring (File/Edit/About)
- Local export-to-path workflows
- Gradual replacement of localhost HTTP coupling with native commands
