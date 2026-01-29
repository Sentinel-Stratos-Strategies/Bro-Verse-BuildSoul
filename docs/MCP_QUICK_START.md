# Quick Start: Connect GitHub MCP Server to Cursor

**Already have your GitHub PAT?** Follow these 3 simple steps:

## Step 1: Open MCP Configuration
- **Mac:** Press `Cmd + ,` for Settings → Look for "MCP" section
- **Windows/Linux:** Press `Ctrl + ,` for Settings → Look for "MCP" section
- Or use the menu: Cursor → Settings → MCP
- Click "Edit MCP Settings"

## Step 2: Add This Configuration

Copy the configuration from [mcp-config-example.json](./mcp-config-example.json) or use this:

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

**Replace** `ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with your actual GitHub Personal Access Token (40 characters after the `ghp_` prefix).

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
