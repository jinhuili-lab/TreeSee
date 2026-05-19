from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class TreeNode(BaseModel):
    id: str
    name: str
    branch_length: float | None = None
    children: list["TreeNode"] = Field(default_factory=list)
    is_leaf: bool
    metadata: dict[str, Any] | None = None
    collapsed: bool = False


TreeNode.model_rebuild()


class ParseTreeResponse(BaseModel):
    tree: TreeNode
    leaf_names: list[str]
    warnings: list[str] = Field(default_factory=list)


class ParseMetadataResponse(BaseModel):
    columns: list[str]
    row_count: int
    id_column: str
    preview: list[dict[str, Any]]


class MatchResponse(BaseModel):
    tree: TreeNode
    matched_count: int
    unmatched_leaves: list[str]
    unmatched_metadata_ids: list[str]
    validation_messages: list[str] = Field(default_factory=list)
