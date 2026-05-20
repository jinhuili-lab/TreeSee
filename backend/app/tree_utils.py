from __future__ import annotations

import csv
from dataclasses import dataclass, field
from io import StringIO
from typing import Any


@dataclass
class ParsedClade:
    name: str | None = None
    branch_length: float | None = None
    clades: list["ParsedClade"] = field(default_factory=list)


@dataclass
class ParsedTree:
    clade: ParsedClade


def parse_newick_text(newick_text: str) -> ParsedTree:
    text = newick_text.strip()
    if not text.endswith(";"):
        raise ValueError("Newick must end with ';'.")
    text = text[:-1]
    idx = 0

    def parse_subtree() -> ParsedClade:
        nonlocal idx
        children: list[ParsedClade] = []
        if idx < len(text) and text[idx] == "(":
            idx += 1
            while True:
                children.append(parse_subtree())
                if idx >= len(text):
                    raise ValueError("Unexpected end of Newick while parsing children.")
                if text[idx] == ",":
                    idx += 1
                    continue
                if text[idx] == ")":
                    idx += 1
                    break
                raise ValueError(f"Unexpected token '{text[idx]}' in children list.")

        start = idx
        while idx < len(text) and text[idx] not in ":,()":
            idx += 1
        name = text[start:idx].strip() or None

        branch_length: float | None = None
        if idx < len(text) and text[idx] == ":":
            idx += 1
            bl_start = idx
            while idx < len(text) and text[idx] not in ",()":
                idx += 1
            raw_bl = text[bl_start:idx].strip()
            if raw_bl:
                try:
                    branch_length = float(raw_bl)
                except ValueError as exc:
                    raise ValueError(f"Invalid branch length: '{raw_bl}'") from exc

        return ParsedClade(name=name, branch_length=branch_length, clades=children)

    root = parse_subtree()
    if idx != len(text):
        raise ValueError("Unexpected trailing content in Newick string.")
    return ParsedTree(clade=root)


def tree_to_json(clade: ParsedClade, node_id_prefix: str = "n", counter: list[int] | None = None) -> dict[str, Any]:
    if counter is None:
        counter = [0]
    counter[0] += 1
    node_id = f"{node_id_prefix}{counter[0]}"
    children = [tree_to_json(child, node_id_prefix=node_id_prefix, counter=counter) for child in clade.clades]
    return {
        "id": node_id,
        "name": clade.name or "",
        "branch_length": clade.branch_length,
        "children": children,
        "is_leaf": len(children) == 0,
        "metadata": None,
        "collapsed": False,
    }


def collect_leaf_names(node: dict[str, Any]) -> list[str]:
    if node["is_leaf"]:
        return [node["name"]]
    leaves: list[str] = []
    for child in node["children"]:
        leaves.extend(collect_leaf_names(child))
    return leaves


def parse_metadata_text(metadata_text: str, filename: str) -> list[dict[str, Any]]:
    sep = "\t" if filename.endswith(".tsv") else ","
    reader = csv.DictReader(StringIO(metadata_text), delimiter=sep)
    if reader.fieldnames is None or "id" not in reader.fieldnames:
        raise ValueError("Metadata must contain an 'id' column.")

    rows: list[dict[str, Any]] = []
    for row in reader:
        normalized = {str(k): v for k, v in row.items()}
        normalized["id"] = str(normalized.get("id", ""))
        rows.append(normalized)
    return rows


def attach_metadata(node: dict[str, Any], metadata_by_id: dict[str, dict[str, Any]]) -> tuple[int, list[str]]:
    matched = 0
    unmatched_leaves: list[str] = []
    if node["is_leaf"]:
        key = node["name"]
        if key in metadata_by_id:
            node["metadata"] = metadata_by_id[key]
            matched += 1
        else:
            unmatched_leaves.append(key)
    else:
        for child in node["children"]:
            m, u = attach_metadata(child, metadata_by_id)
            matched += m
            unmatched_leaves.extend(u)
    return matched, unmatched_leaves
