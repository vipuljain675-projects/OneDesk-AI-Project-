"""
load_handbook.py
Reads all .md files from the data/handbook/ directory.
Returns list of dicts: {filename, content}
"""
import os

HANDBOOK_DIR = os.path.join(os.path.dirname(__file__), "../data/handbook")


def load_markdown_files() -> list[dict]:
    """Load all .md files from handbook directory."""
    docs = []
    for root, dirs, files in os.walk(HANDBOOK_DIR):
        for file in files:
            if file.endswith(".md"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                rel_path = os.path.relpath(filepath, HANDBOOK_DIR)
                docs.append({
                    "filename": rel_path,
                    "content": content
                })
    print(f"[Loader] Loaded {len(docs)} markdown files from handbook.")
    return docs
