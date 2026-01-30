"""LLM helper calls (placeholder for future FastAPI integration)."""
import openai


def chat(system_prompt: str, user_prompt: str, model: str = "gpt-4o", temperature: float = 0.7):
    response = openai.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )
    return response.choices[0].message.content
