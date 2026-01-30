import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "memory.db"
CHROMA_PATH = DATA_DIR / "chroma"
CHARACTERS_DIR = BASE_DIR / "broverse" / "characters"
CANON_DIR = BASE_DIR / "broverse" / "canon"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o"
