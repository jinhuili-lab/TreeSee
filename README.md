# Protein Tree Studio

Protein Tree Studio is a scientific visualization platform for **protein similarity trees**, **structural clustering trees**, **domain-family trees**, and related dendrogram workflows.

> Terminology note: this project treats input as general trees/dendrograms (not always true phylogenetic trees).

---

## Scientific motivation

Researchers often need one practical tool to:
- parse and validate Newick trees,
- attach metadata tables reliably,
- inspect clusters interactively,
- export publication-oriented graphics,
- and keep strict scientific integrity (no silent ID drops or topology mutation).

Protein Tree Studio combines web-first iteration with a desktop delivery path (Tauri) for zero-friction end users.

---

## Repository layout

- `frontend/` — React + TypeScript + Vite + D3 tree UI
- `backend/` — FastAPI parsing/matching API
- `desktop/` — Tauri desktop scaffold and native command bridge
- `examples/` — sample Newick + metadata inputs
- `.github/workflows/` — CI packaging workflows
- `AGENTS.md` — engineering/scientific constraints for automated contributors

---

## Supported tree scenarios

- Protein similarity tree
- Structural clustering tree
- Domain-family tree
- Hierarchical clustering dendrogram
- Sequence-derived tree-like structures

---

## Core backend capabilities

### API endpoints

- `GET /health`
- `POST /api/parse-tree`
- `POST /api/parse-metadata`
- `POST /api/match`

### Behavior guarantees

- Exact ID matching from metadata `id` to tree leaf names.
- Explicit reporting for:
  - unmatched tree leaves
  - unmatched metadata IDs
- No silent row/leaf dropping.

---

## Input formats

### Newick example

```newick
((ProteinA:0.1,ProteinB:0.2)Node1:0.3,(ProteinC:0.2,ProteinD:0.4)Node2:0.5)Root;
```

### Metadata CSV example

```csv
id,family,domain_type,species,cluster,dali_zscore,esm_cluster,protein_length,plddt
ProteinA,BECR,Toxin,Bacillus subtilis,C1,18.4,E1,235,91.2
ProteinB,BECR,Toxin,Escherichia coli,C1,16.9,E1,241,88.5
ProteinC,HNH,Nuclease,Pseudomonas aeruginosa,C2,9.7,E2,198,84.1
ProteinD,Other,Unknown,Streptomyces sp.,C3,5.1,E3,300,76.3
```

---

## Local development

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run tests:

```bash
cd backend
pytest
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Build:

```bash
cd frontend
npm run build
```

---

## Desktop (Tauri) development

### Dev run (Windows helper)

```bat
cd desktop
run-windows-dev.bat
```

### Manual Tauri run

```bash
cd desktop
npm install
npm run tauri:dev
```

---

## Windows one-click scripts (repository root)

- `build_project.bat`
  - builds frontend
  - builds desktop bundle
  - copies resulting `.exe` to `bin/ProteinTreeStudio.exe`

- `ClusterPro.bat`
  - checks for `bin/ProteinTreeStudio.exe`
  - auto-builds via `build_project.bat` if missing
  - launches desktop executable

### Future launcher packaging

You can wrap `ClusterPro.bat` into `ClusterPro.exe` (e.g., **Bat To Exe Converter**) for a no-console launcher experience.

---

## CI desktop packaging (Windows)

Workflow file:

- `.github/workflows/windows-desktop-release.yml`

It performs:
- frontend build (Node 20)
- Tauri Windows bundle build
- artifact upload
- release asset publishing on tags matching `v*`

Tag example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This enables user distribution without requiring Node/npm/Rust on end-user machines.

---

## Current limitations

- Frontend feature surface is evolving; some iTOL-like controls are scaffolded progressively.
- Browser-side TIFF export can vary by runtime support.
- PDF export currently follows a practical MVP path and may be further hardened with dedicated libraries.
- Desktop runtime still requires full local toolchain for developers, while end users should consume CI-built installers.

---

## Roadmap (short)

- Deepen iTOL-style track/layer control wiring
- Improve publication export presets (DPI/page templates)
- Harden desktop-native file workflows
- Expand CI release channels and signing pipeline
- Add macOS/Linux desktop tracks (currently Windows-focused)

---

## Scientific integrity policy

This project does **not** allow silent scientific data mutation:
- do not alter topology during interaction,
- do not silently drop unmatched metadata or leaves,
- always surface validation mismatches.

See `AGENTS.md` for enforceable contributor rules.
