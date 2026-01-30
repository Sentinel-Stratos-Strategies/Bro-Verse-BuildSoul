import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "memory.db"
DB_PATH.parent.mkdir(exist_ok=True)

SCHEMA_SQL = r"""
-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Avatars (BroVerse characters)
CREATE TABLE IF NOT EXISTS avatars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    archetype TEXT,
    config_path TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (session containers)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    avatar_id TEXT REFERENCES avatars(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    platform TEXT,
    session_metadata TEXT
);

-- Messages (raw conversation turns)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    avatar_id TEXT REFERENCES avatars(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

-- Memory Items (the core memory layer)
CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    layer TEXT NOT NULL CHECK (layer IN ('CANON', 'PROFILE', 'EPISODIC', 'AFFECTIVE')),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    user_id TEXT REFERENCES users(id),
    avatar_ids TEXT,
    topic_tags TEXT,
    entity_links TEXT,
    source_type TEXT,
    source_id TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    salience REAL DEFAULT 0.5 CHECK (salience BETWEEN 0 AND 1),
    confidence REAL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
    valence REAL CHECK (valence IS NULL OR valence BETWEEN -1 AND 1),
    intensity REAL CHECK (intensity IS NULL OR intensity BETWEEN 0 AND 1),
    visibility TEXT DEFAULT 'private',
    redactions TEXT,
    status TEXT DEFAULT 'active',
    supersedes TEXT REFERENCES memory_items(id),
    superseded_by TEXT REFERENCES memory_items(id),
    version INTEGER DEFAULT 1,
    embedding_id TEXT,
    embedding_model TEXT
);

CREATE INDEX IF NOT EXISTS idx_memory_layer ON memory_items(layer, status);
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memory_effective ON memory_items(effective_at);
CREATE INDEX IF NOT EXISTS idx_memory_salience ON memory_items(salience DESC);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_items(topic_tags);

-- Missions (BroVerse Calls)
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT DEFAULT 'active',
    outcome TEXT,
    reflection TEXT,
    memory_ids TEXT
);

-- Artifacts (files, exports, code snippets)
CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id),
    user_id TEXT REFERENCES users(id),
    type TEXT NOT NULL,
    file_path TEXT,
    content TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def init_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executescript(SCHEMA_SQL)
    cursor.execute(
        "INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)",
        ("user_joe", "Joe Athan Ellis"),
    )
    conn.commit()
    conn.close()
    print(f"✓ Database initialized at {DB_PATH}")


if __name__ == "__main__":
    init_database()
