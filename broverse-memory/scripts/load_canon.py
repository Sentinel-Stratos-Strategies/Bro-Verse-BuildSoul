from pathlib import Path
import json
from src.memory import create_memory
from src.models import CreateMemoryRequest, MemoryLayer

CANON_DIR = Path(__file__).resolve().parent.parent / "broverse" / "canon"
USER_ID = "user_joe"


def load_glossary():
    glossary_path = CANON_DIR / "glossary.json"
    if not glossary_path.exists():
        return []
    with open(glossary_path) as f:
        data = json.load(f)
    memories = []
    for term, definition in data.items():
        memories.append(
            CreateMemoryRequest(
                layer=MemoryLayer.CANON,
                type="rule",
                title=term,
                content=definition,
                user_id=USER_ID,
                salience=0.9,
            )
        )
    return memories


def load_rules():
    rules_path = CANON_DIR / "rules.md"
    if not rules_path.exists():
        return []
    entries = []
    with open(rules_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            entries.append(line)
    memories = []
    for rule in entries:
        memories.append(
            CreateMemoryRequest(
                layer=MemoryLayer.CANON,
                type="rule",
                title="Rule",
                content=rule,
                user_id=USER_ID,
                salience=1.0,
            )
        )
    return memories


def main():
    memories = load_glossary() + load_rules()
    for req in memories:
        create_memory(req)
    print(f"Loaded {len(memories)} canonical memories.")


if __name__ == "__main__":
    main()
