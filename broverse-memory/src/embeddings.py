import os
from typing import List, Optional

import chromadb
from chromadb.config import Settings
import openai

from . import config

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(
    path=str(config.CHROMA_PATH),
    settings=Settings(anonymized_telemetry=False),
)

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="broverse_memories",
    metadata={"description": "BroVerse memory embeddings"},
)

openai.api_key = os.getenv("OPENAI_API_KEY")


def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI."""
    response = openai.embeddings.create(model=config.EMBEDDING_MODEL, input=text)
    return response.data[0].embedding


def add_memory_embedding(memory_id: str, title: str, content: str, metadata: dict) -> str:
    """Add memory to vector store."""
    text = f"{title}. {content}"
    embedding = generate_embedding(text)

    collection.add(
        ids=[memory_id], embeddings=[embedding], documents=[text], metadatas=[metadata]
    )

    return memory_id


def search_similar_memories(
    query: str, user_id: str, layers: Optional[List[str]] = None, limit: int = 10
) -> List[dict]:
    """Vector similarity search."""
    query_embedding = generate_embedding(query)

    where_filter = {"user_id": user_id, "status": "active"}
    if layers:
        where_filter["layer"] = {"$in": layers}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=limit,
        where=where_filter,
        include=["distances", "metadatas", "documents"],
    )

    if not results["ids"]:
        return []

    formatted_results = []
    for i, memory_id in enumerate(results["ids"][0]):
        formatted_results.append(
            {
                "id": memory_id,
                "distance": results["distances"][0][i],
                "similarity": 1 - results["distances"][0][i],
                "metadata": results["metadatas"][0][i],
                "content": results["documents"][0][i],
            }
        )

    return formatted_results

