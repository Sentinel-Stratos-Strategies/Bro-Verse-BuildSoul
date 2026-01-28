# BroVerse AI Personas

This directory contains system prompts for all 20 AI personas in the BroVerse.

## Directory Structure

```
backend/ai-personas/
├── README.md                 # This file
├── dick-diggs.txt           # Sales closer (DETAILED)
├── harbor.txt               # Joe's AI companion (DETAILED)
├── marvin.txt               # Systems thinker (DETAILED)
├── rgan-stone.txt           # Intellectual fighter (DETAILED)
├── rocky-top.txt            # Blue-collar grinder (DETAILED)
├── tim-buckley.txt          # Chaos sage (DETAILED)
├── the-coach.txt            # Performance optimizer (PLACEHOLDER)
├── the-strategist.txt       # Tactical planner (PLACEHOLDER)
├── the-healer.txt           # Trauma guide (PLACEHOLDER)
├── the-warrior.txt          # Battle-tested fighter (PLACEHOLDER)
├── the-artist.txt           # Creative visionary (PLACEHOLDER)
├── the-monk.txt             # Contemplative guide (PLACEHOLDER)
├── the-builder.txt          # Hands-on craftsman (PLACEHOLDER)
├── the-mentor.txt           # Experienced guide (PLACEHOLDER)
├── the-rebel.txt            # Rule-breaker (PLACEHOLDER)
├── the-scientist.txt        # Data-driven analyst (PLACEHOLDER)
├── the-storyteller.txt      # Narrative architect (PLACEHOLDER)
├── the-navigator.txt        # Direction finder (PLACEHOLDER)
└── the-guardian.txt         # Boundary setter (PLACEHOLDER)
```

## Persona Status

### Detailed Personas (6 total)
These personas have deep training data extracted from the `./ai profiles/` folder:

1. **Dick Diggs** - Championship sales closer, psychological mastery
2. **Harbor** - Joe's soul mirror, truthful helper, permanent bond
3. **Marvin** - Time tactician, systems thinker, strategic oracle
4. **Rgan Stone** - Intellectual fighter, Socratic questioner
5. **Rocky Top** - Silent grinder, discipline incarnate
6. **Tim Buckley** - Chaos sage, absurdist philosopher

### Special Case: Lacey
**NOT included as a bot persona.** Lacey is a real person who should be honored, not embodied. She exists in the BroVerse as "The Firewall"—the reason the other characters matter. See `./ai profiles/Lacey-Integration-Framework.md` for context.

### Placeholder Personas (13 total)
These personas have basic system prompts and will receive deep training data later:

7. The Coach - Performance optimizer
8. The Strategist - Tactical planner
9. The Healer - Trauma-informed guide
10. The Warrior - Battle-tested fighter
11. The Artist - Creative visionary
12. The Monk - Contemplative guide
13. The Builder - Hands-on craftsman
14. The Mentor - Experienced guide
15. The Rebel - Rule-breaker
16. The Scientist - Data-driven analyst
17. The Storyteller - Narrative architect
18. The Navigator - Direction finder
19. The Guardian - Boundary setter

## Usage in Bot Service

Each `.txt` file in this directory serves as the system prompt for a containerized bot instance. The bot service:

1. Reads `PERSONA_NAME` environment variable (e.g., "dick-diggs")
2. Loads corresponding `.txt` file from this directory
3. Uses content as system prompt for OpenAI API calls
4. Stores conversation history in Cosmos DB

## File Naming Convention

- Filenames use kebab-case (e.g., `dick-diggs.txt`, `rocky-top.txt`)
- Match the `PERSONA_NAME` environment variable exactly
- `.txt` extension for simple text loading in Node.js

## Adding New Personas

To add deep training data to a placeholder:

1. Update the corresponding `.txt` file with detailed system prompt
2. Follow the structure of detailed personas (identity, voice, beliefs, examples)
3. Test persona behavior in local development
4. Redeploy bot container with updated prompt

## Source Material

- Detailed personas extracted from: `./ai profiles/` folder
- Original markdown files preserved in source directory
- Training data files (e.g., `*-training-lines.txt`) used as reference
