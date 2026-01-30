# BroVerse Memory System

Production-grade, inspectable memory substrate for BroVerse personas. Supports multi-layer memories (CANON, PROFILE, EPISODIC, AFFECTIVE), hybrid retrieval, and persona-specific context assembly.

## Quickstart
```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # set OPENAI_API_KEY
python cli.py init
python cli.py add --layer CANON --type rule --title "BroVerse Rule 1" --content "This is construction, not therapy" --salience 1.0
python cli.py list --layer CANON
python cli.py search "construction"
python cli.py chat "What is the BroVerse philosophy?" --avatar harbor
```

## Structure
- `data/` SQLite + Chroma persistence (gitignored)
- `broverse/` canon and character configs/prompts
- `src/` core logic (DB, memory CRUD, embeddings, retrieval, context, avatars, extraction)
- `scripts/` init/load/migrate utilities
- `tests/` basic tests
- `cli.py` command entrypoint

## Notes
- SQLite for dev; schema is Postgres-ready.
- ChromaDB embedded client; anonymized telemetry disabled.
- OpenAI models: `gpt-4o` (chat) and `text-embedding-3-small` (embeddings).
