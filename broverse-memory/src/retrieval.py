import math
from datetime import datetime
from typing import List, Optional

from .memory import get_memories, search_memories_text
from .embeddings import search_similar_memories


def retrieve_memories(
    query: str,
    user_id: str,
    layers: Optional[List[str]] = None,
    limit: int = 10,
    min_score: float = 0.3,
) -> List[dict]:
    """
    Hybrid retrieval: vector similarity + metadata filtering + scoring.
    Combines vector similarity (40%), recency (20%), salience (30%), text match bonus (10%).
    """

    vector_results = search_similar_memories(query, user_id, layers, limit=limit * 3)
    text_results = search_memories_text(user_id, query, layers, limit=limit * 2)
    text_match_ids = {r["id"] for r in text_results}

    scored_results = []
    for result in vector_results:
        metadata = result["metadata"]
        vector_score = result["similarity"]

        effective_at = metadata.get("effective_at")
        if effective_at:
            effective_dt = datetime.fromisoformat(effective_at)
            days_old = (datetime.now() - effective_dt).days
        else:
            days_old = 0
        recency_score = math.exp(-days_old / 30)

        salience_score = float(metadata.get("salience", 0.5))
        text_bonus = 0.2 if result["id"] in text_match_ids else 0.0

        final_score = (
            0.4 * vector_score
            + 0.2 * recency_score
            + 0.3 * salience_score
            + 0.1 * (1.0 if text_bonus else 0.0)
        )

        if final_score >= min_score:
            scored_results.append(
                {
                    "memory_id": result["id"],
                    "score": final_score,
                    "breakdown": {
                        "vector": vector_score,
                        "recency": recency_score,
                        "salience": salience_score,
                        "text_match": bool(text_bonus),
                    },
                    "metadata": metadata,
                    "content": result["content"],
                }
            )

    scored_results.sort(key=lambda x: x["score"], reverse=True)
    return scored_results[:limit]


def format_retrieval_results(results: List[dict]) -> str:
    lines = []
    for i, result in enumerate(results, 1):
        layer = result["metadata"].get("layer")
        title = result["metadata"].get("title")
        score = result["score"]
        breakdown = result["breakdown"]
        lines.append(f"{i}. [{layer}] {title}")
        lines.append(
            f"   Score: {score:.2f} (vec:{breakdown['vector']:.2f}, rec:{breakdown['recency']:.2f}, sal:{breakdown['salience']:.2f})"
        )
        lines.append("")
    return "\n".join(lines)

