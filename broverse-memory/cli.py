import os
from datetime import datetime

import click
import openai
from dotenv import load_dotenv

from src.db import init_database
from src.memory import create_memory, get_memories, search_memories_text
from src.retrieval import retrieve_memories, format_retrieval_results
from src.context import build_context
from src.avatars import load_avatar_config, get_system_prompt
from src.models import CreateMemoryRequest, MemoryLayer
from src.embeddings import add_memory_embedding

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

USER_ID = "user_joe"


@click.group()
def cli():
    """BroVerse Memory System CLI"""


@cli.command()
def init():
    """Initialize database and load canonical memories."""
    from scripts.init_db import SCHEMA_SQL

    click.echo("Initializing database...")
    init_database(SCHEMA_SQL)
    click.echo("✓ Database initialized")
    click.echo("(Optional) run scripts/load_canon.py to load canon")


@cli.command()
@click.option("--layer", type=click.Choice(["CANON", "PROFILE", "EPISODIC", "AFFECTIVE"]), required=True)
@click.option("--type", "type_", required=True, help="Memory type (e.g., rule, fact, event, preference)")
@click.option("--title", required=True, help="Memory title")
@click.option("--content", required=True, help="Memory content")
@click.option("--tags", help="Comma-separated tags")
@click.option("--salience", type=float, default=0.7, help="Importance score (0-1)")
def add(layer, type_, title, content, tags, salience):
    """Add a new memory."""
    topic_tags = [t.strip() for t in tags.split(",")] if tags else []

    req = CreateMemoryRequest(
        layer=MemoryLayer(layer),
        type=type_,
        title=title,
        content=content,
        user_id=USER_ID,
        topic_tags=topic_tags,
        salience=salience,
    )

    memory_id = create_memory(req)

    add_memory_embedding(
        memory_id=memory_id,
        title=title,
        content=content,
        metadata={
            "user_id": USER_ID,
            "layer": layer,
            "title": title,
            "salience": salience,
            "effective_at": str(datetime.now()),
            "status": "active",
        },
    )

    click.echo(f"✓ Created memory: {memory_id}")


@cli.command()
@click.option("--layer", type=click.Choice(["CANON", "PROFILE", "EPISODIC", "AFFECTIVE"]))
@click.option("--limit", type=int, default=20)
def list(layer, limit):
    """List memories."""
    layers = [MemoryLayer(layer)] if layer else None
    memories = get_memories(USER_ID, layers=layers, limit=limit)

    click.echo(f"\nFound {len(memories)} memories:\n")
    for mem in memories:
        click.echo(f"[{mem['layer']}] {mem['title']}")
        click.echo(f"  {mem['content'][:100]}...")
        click.echo(f"  Salience: {mem['salience']}, Created: {mem['created_at']}\n")


@cli.command()
@click.argument("query")
@click.option("--limit", type=int, default=10)
def search(query, limit):
    """Search memories by query (hybrid search)."""
    results = retrieve_memories(query=query, user_id=USER_ID, limit=limit)

    click.echo(f"\nFound {len(results)} relevant memories:\n")
    click.echo(format_retrieval_results(results))

    if results:
        top = results[0]
        click.echo("\n--- Top Result ---")
        click.echo(f"[{top['metadata']['layer']}] {top['metadata']['title']}")
        click.echo(f"\n{top['content']}\n")


@cli.command()
@click.argument("query")
@click.option("--avatar", help="Avatar ID (harbor, dick_diggs, marvin)")
def chat(query, avatar):
    """Chat with context from memory."""
    context = build_context(user_id=USER_ID, current_query=query, avatar_id=avatar)

    system_prompt = ""
    if avatar:
        config = load_avatar_config(avatar)
        if config:
            system_prompt = get_system_prompt(avatar)
            click.echo(f"\n[Using avatar: {config.name}]\n")

    full_system = f"{system_prompt}\n\n{context}" if system_prompt else context

    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": full_system},
            {"role": "user", "content": query},
        ],
        temperature=0.7,
    )

    answer = response.choices[0].message.content
    click.echo(f"\n{answer}\n")


if __name__ == "__main__":
    cli()
