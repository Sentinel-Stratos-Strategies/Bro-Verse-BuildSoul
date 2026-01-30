from src.retrieval import format_retrieval_results

def test_format_retrieval_results():
    results = [
        {
            "metadata": {"layer": "CANON", "title": "Rule"},
            "score": 0.9,
            "breakdown": {"vector": 0.9, "recency": 1.0, "salience": 1.0, "text_match": True},
            "content": "",
        }
    ]
    text = format_retrieval_results(results)
    assert "[CANON] Rule" in text
