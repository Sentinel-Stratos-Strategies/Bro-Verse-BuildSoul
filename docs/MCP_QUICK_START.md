# Quick Start: Connect GitHub MCP Server to Cursor

**Already have your GitHub PAT?** Follow these 3 simple steps:

## Step 1: Open MCP Configuration
- Press `Cmd/Ctrl + Shift + J` in Cursor → Look for "MCP" or "Model Context Protocol"
- Click "Edit MCP Settings"

## Step 2: Add This Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
      }
    }
  }
}
```

**Replace** `your_github_pat_here` with your actual GitHub Personal Access Token.

## Step 3: Restart Cursor
- Save the file
- Completely close and reopen Cursor IDE
- Done! 🎉

## Verify It's Working
Ask Cursor: "Show me the recent commits in this repository"

## Need More Help?
See the [full setup guide](./MCP_GITHUB_SETUP.md) for:
- Docker setup option
- Troubleshooting
- Security best practices
- Advanced configurations

---

**Note:** Your PAT must have `repo` and optionally `workflow` scopes.
