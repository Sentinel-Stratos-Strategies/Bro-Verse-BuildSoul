import json
from pathlib import Path
from typing import Optional
from .models import AvatarConfig

CHARACTERS_DIR = Path(__file__).resolve().parent.parent / "broverse" / "characters"


def load_avatar_config(avatar_id: str) -> Optional[AvatarConfig]:
    config_path = CHARACTERS_DIR / avatar_id / "config.json"
    if not config_path.exists():
        return None
    with open(config_path) as f:
        data = json.load(f)
    return AvatarConfig(**data)


def get_system_prompt(avatar_id: str) -> str:
    prompt_path = CHARACTERS_DIR / avatar_id / "system_prompt.txt"
    if not prompt_path.exists():
        return ""
    with open(prompt_path) as f:
        return f.read().strip()

