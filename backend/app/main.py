from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile

from .models import MatchResponse, ParseMetadataResponse, ParseTreeResponse
from .tree_utils import attach_metadata, collect_leaf_names, parse_metadata_text, parse_newick_text, tree_to_json

app = FastAPI(title="Protein Tree Studio API")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/parse-tree", response_model=ParseTreeResponse)
async def parse_tree(file: UploadFile = File(...)):
    try:
        text = (await file.read()).decode("utf-8")
        tree = parse_newick_text(text)
        tree_json = tree_to_json(tree.clade)
        leaves = collect_leaf_names(tree_json)
        return ParseTreeResponse(tree=tree_json, leaf_names=leaves)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse Newick tree: {exc}") from exc


@app.post("/api/parse-metadata", response_model=ParseMetadataResponse)
async def parse_metadata(file: UploadFile = File(...)):
    try:
        text = (await file.read()).decode("utf-8")
        rows = parse_metadata_text(text, file.filename or "metadata.csv")
        columns = list(rows[0].keys()) if rows else ["id"]
        return ParseMetadataResponse(
            columns=columns,
            row_count=len(rows),
            id_column="id",
            preview=rows[:10],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse metadata file: {exc}") from exc


@app.post("/api/match", response_model=MatchResponse)
async def match_tree_metadata(tree_file: UploadFile = File(...), metadata_file: UploadFile = File(...)):
    try:
        tree_text = (await tree_file.read()).decode("utf-8")
        metadata_text = (await metadata_file.read()).decode("utf-8")
        tree = parse_newick_text(tree_text)
        tree_json = tree_to_json(tree.clade)

        rows = parse_metadata_text(metadata_text, metadata_file.filename or "metadata.csv")
        metadata_by_id = {row["id"]: row for row in rows}

        matched_count, unmatched_leaves = attach_metadata(tree_json, metadata_by_id)
        leaf_set = set([x for x in collect_leaf_names(tree_json) if x])
        unmatched_metadata_ids = sorted([mid for mid in metadata_by_id if mid not in leaf_set])

        messages = []
        if unmatched_leaves:
            messages.append(f"Unmatched tree leaves: {len(unmatched_leaves)}")
        if unmatched_metadata_ids:
            messages.append(f"Unmatched metadata IDs: {len(unmatched_metadata_ids)}")

        return MatchResponse(
            tree=tree_json,
            matched_count=matched_count,
            unmatched_leaves=sorted([x for x in unmatched_leaves if x]),
            unmatched_metadata_ids=unmatched_metadata_ids,
            validation_messages=messages,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to match tree and metadata: {exc}") from exc
