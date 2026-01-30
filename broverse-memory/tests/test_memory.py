from src.memory import create_memory, get_memories
from src.models import CreateMemoryRequest, MemoryLayer

def test_create_and_list_memory(tmp_path, monkeypatch):
    # Simple smoke test using real DB file location override
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    req = CreateMemoryRequest(
        layer=MemoryLayer.CANON,
        type="rule",
        title="Rule 1",
        content="Construction not therapy",
        user_id="user_test",
    )
    mem_id = create_memory(req)
    memories = get_memories("user_test")
    assert any(m["id"] == mem_id for m in memories)
