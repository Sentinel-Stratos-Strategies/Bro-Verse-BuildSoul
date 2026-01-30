from typing import List, Optional
from .memory import get_memories
from .retrieval import retrieve_memories
from .models import MemoryLayer


def build_context(
    user_id: str,
    current_query: str,
    avatar_id: Optional[str] = None,
    conversation_history: Optional[List[dict]] = None,
    max_tokens: int = 6000,
) -> str:
    """Assemble context from memories for LLM."""

    sections = []
    token_count = 0

    # 1. CANONICAL RULES
    canon_memories = get_memories(user_id=user_id, layers=[MemoryLayer.CANON], limit=50)
    if avatar_id:
        canon_memories = [m for m in canon_memories if avatar_id in (m.get("avatar_ids") or [])]
    if canon_memories:
        canon_text = "### CANONICAL RULES\n\n"
        for mem in canon_memories:
            canon_text += f"**{mem['title']}**\n{mem['content']}\n\n"
        sections.append(canon_text)
        token_count += len(canon_text) // 4

    # 2. USER PROFILE
    profile_memories = get_memories(user_id=user_id, layers=[MemoryLayer.PROFILE], limit=30)
    if profile_memories:
        profile_text = "### USER PROFILE\n\n"
        for mem in profile_memories:
            profile_text += f"- **{mem['title']}**: {mem['content']}\n"
        sections.append(profile_text)
        token_count += len(profile_text) // 4

    # 3. RELEVANT MEMORIES
    if current_query:
        relevant = retrieve_memories(
            query=current_query,
            user_id=user_id,
            layers=["EPISODIC", "AFFECTIVE"],
            limit=10,
        )
        if relevant:
            relevant_text = "### RELEVANT MEMORIES\n\n"
            for result in relevant:
                mem = result["metadata"]
                relevant_text += f"[{mem['layer']}] **{mem['title']}**\n"
                relevant_text += f"{result['content']}\n"
                relevant_text += f"_(Relevance: {result['score']:.2f})_\n\n"
                if token_count + len(relevant_text) // 4 > max_tokens * 0.7:
                    break
            sections.append(relevant_text)
            token_count += len(relevant_text) // 4

    # 4. CONVERSATION HISTORY
    if conversation_history:
        history_text = "### RECENT CONVERSATION\n\n"
        for msg in conversation_history[-5:]:
            role = msg.get("role", "").upper()
            content = msg.get("content", "")
            history_text += f"**{role}**: {content}\n\n"
        sections.append(history_text)

    return "\n---\n\n".join(sections)

