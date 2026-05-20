from app.tree_utils import attach_metadata, collect_leaf_names, parse_metadata_text, parse_newick_text, tree_to_json


def test_parse_newick_and_leafs():
    newick = "((ProteinA:0.1,ProteinB:0.2)Node1:0.3,(ProteinC:0.2,ProteinD:0.4)Node2:0.5)Root;"
    tree = parse_newick_text(newick)
    tree_json = tree_to_json(tree.clade)
    leaves = sorted(collect_leaf_names(tree_json))
    assert leaves == ["ProteinA", "ProteinB", "ProteinC", "ProteinD"]


def test_metadata_matching_reports_unmatched():
    newick = "(ProteinA:0.1,ProteinX:0.2)Root;"
    metadata = "id,family\nProteinA,BECR\nProteinB,HNH\n"
    tree = parse_newick_text(newick)
    tree_json = tree_to_json(tree.clade)
    rows = parse_metadata_text(metadata, "m.csv")
    metadata_by_id = {r["id"]: r for r in rows}
    matched, unmatched_leaves = attach_metadata(tree_json, metadata_by_id)
    assert matched == 1
    assert unmatched_leaves == ["ProteinX"]
