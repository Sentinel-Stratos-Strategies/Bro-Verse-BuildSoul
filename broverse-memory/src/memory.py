import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Optional

from .models import MemoryItem, CreateMemoryRequest, MemoryLayer
from .db import get_connection

DB_PATH = get_connection


def create_memory(req: CreateMemoryRequest, embedding_id: Optional[str] = None) -> str:
    """Create a new memory item."""
    memory_id = f"mem_{uuid.uuid4().hex[:12]}"

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO memory_items (
            id, layer, type, title, content,
            user_id, avatar_ids, topic_tags,
            source_type, source_id, created_by,
            salience, confidence, valence, intensity,
            embedding_id, embedding_model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            memory_id,
            req.layer.value,
            req.type,
            req.title,
            req.content,
            req.user_id,
            json.dumps(req.avatar_ids or []),
            json.dumps(req.topic_tags or []),
            "system",
            None,
            "system",
            req.salience,
            req.confidence,
            req.valence,
            req.intensity,
            embedding_id,
            "text-embedding-3-small" if embedding_id else None,
        ],
    )

    conn.commit()
    conn.close()

    return memory_id


def get_memories(
    user_id: str,
    layers: Optional[List[MemoryLayer]] = None,
    status: str = "active",
    limit: int = 100,
) -> List[dict]:
    """Retrieve memories by user and layer."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT * FROM memory_items
        WHERE user_id = ? AND status = ?
    """
    params = [user_id, status]

    if layers:
        layer_values = [l.value for l in layers]
        placeholders = ",".join("?" * len(layer_values))
        query += f" AND layer IN ({placeholders})"
        params.extend(layer_values)

    query += " ORDER BY salience DESC, created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def search_memories_text(
    user_id: str,
    query: str,
    layers: Optional[List[MemoryLayer]] = None,
    limit: int = 20,
) -> List[dict]:
    """Basic text search across memories."""
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
        SELECT * FROM memory_items
        WHERE user_id = ?
        AND status = 'active'
        AND (title LIKE ? OR content LIKE ?)
    """
    params = [user_id, f"%{query}%", f"%{query}%"]

    if layers:
        layer_values = [l.value for l in layers]
        placeholders = ",".join("?" * len(layer_values))
        sql += f" AND layer IN ({placeholders})"
        params.extend(layer_values)

    sql += " ORDER BY salience DESC LIMIT ?"
    params.append(limit)

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def update_memory_status(memory_id: str, status: str):
    """Update memory status (active/deprecated/revoked)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE memory_items SET status = ? WHERE id = ?",
        [status, memory_id],
    )
    conn.commit()
    conn.close()

