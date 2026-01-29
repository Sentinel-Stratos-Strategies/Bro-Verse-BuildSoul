# GitHub MCP Server Setup Guide for Cursor

This guide will help you connect the GitHub MCP (Model Context Protocol) server to Cursor IDE so you can interact with GitHub repositories directly through AI assistance.

## Prerequisites

- ✅ **Cursor IDE** installed (latest version recommended)
- ✅ **GitHub Personal Access Token (PAT)** with appropriate permissions
- ✅ **Node.js** (version 18 or later) for npx method, OR
- ✅ **Docker** installed and running for Docker method

## Step 1: Verify Your GitHub Personal Access Token

You mentioned you already have your GitHub PAT in Cursor. Make sure it has the following scopes:

### Required Token Scopes:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows (optional, but recommended)
- `read:org` - Read organization data (if working with organizations)

To create or verify your token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)" if you need a new one
3. Select the scopes listed above
4. Copy and **save your token securely** (you won't be able to see it again)

## Step 2: Configure the MCP Server in Cursor

You have two options for configuring the GitHub MCP server: **npx (recommended)** or **Docker**.

### Option A: Using npx (Recommended - Simpler Setup)

1. **Open Cursor Settings**
   - Press `Cmd/Ctrl + Shift + J` to open Cursor Settings
   - OR click on the gear icon in the bottom left → Settings

2. **Navigate to MCP Settings**
   - Look for "Model Context Protocol" or "MCP" section
   - Click on "Edit MCP Settings" or similar option

3. **Add the GitHub MCP Server Configuration**
   
   Cursor will open your MCP configuration file. Add this configuration:

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

   **Important:** Replace `your_github_pat_here` with your actual GitHub Personal Access Token.

### Option B: Using Docker

If you prefer Docker (useful for isolated environments):

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "mcp/github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
      }
    }
  }
}
```

**Important:** Replace `your_github_pat_here` with your actual GitHub Personal Access Token.

## Step 3: Configuration File Location

The MCP configuration file can be placed in two locations:

### Global Configuration (All Projects)
Create or edit: `~/.cursor/mcp.json` (or `%USERPROFILE%\.cursor\mcp.json` on Windows)

### Project-Specific Configuration (This Project Only)
Create or edit: `.cursor/mcp.json` in your project root

**Recommendation:** Start with global configuration, then move to project-specific if needed.

## Step 4: Save and Restart Cursor

1. **Save** your `mcp.json` configuration file
2. **Restart Cursor IDE** completely (close all windows and reopen)
3. Wait a few moments for Cursor to initialize the MCP connection

## Step 5: Verify the Connection

1. Open Cursor Settings again
2. Navigate to the MCP section
3. You should see "github" listed as an active MCP server
4. Try asking Cursor something like:
   - "List the recent issues in this repository"
   - "Show me the latest commits"
   - "Create a new branch called feature/test"

If the MCP server is working, Cursor will be able to interact with your GitHub repositories!

## Example Configuration (Complete)

Here's a complete example with GitHub MCP configured using npx:

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_yourActualTokenHere123456789"
      }
    }
  }
}
```

## Troubleshooting

### Issue: "MCP server not responding"
- **Solution:** Verify your GitHub PAT is correct and has the right scopes
- Check that Node.js (for npx) or Docker (for Docker method) is installed and accessible
- Restart Cursor IDE

### Issue: "Permission denied" errors
- **Solution:** Your PAT might not have the required scopes
- Go to GitHub → Settings → Developer settings → Personal access tokens
- Edit your token and add `repo` and `workflow` scopes
- Generate a new token and update your `mcp.json`

### Issue: "Cannot find npx command"
- **Solution:** Install Node.js (version 18+)
- Download from: https://nodejs.org/
- After installation, restart your terminal/Cursor

### Issue: "Docker daemon not running" (Docker method only)
- **Solution:** Start Docker Desktop or Docker daemon
- On Mac: Open Docker Desktop application
- On Windows: Start Docker Desktop
- On Linux: Run `sudo systemctl start docker`

### Issue: Configuration file not found
- **Solution:** Create the directory if it doesn't exist:
  - Mac/Linux: `mkdir -p ~/.cursor && touch ~/.cursor/mcp.json`
  - Windows: Create folder `.cursor` in your user profile directory

### Issue: Token showing in plaintext (Security concern)
- **Consider:** Using environment variables or a secure credential manager
- **Alternative:** Store the token in your system environment variables and reference it:
  ```json
  {
    "mcpServers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"]
      }
    }
  }
  ```
  Then set `GITHUB_PERSONAL_ACCESS_TOKEN` as a system environment variable.

## Advanced: Multiple MCP Servers

You can configure multiple MCP servers in the same configuration file:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

## What Can You Do with GitHub MCP?

Once configured, you can ask Cursor to:
- 📋 List and read issues
- 🔀 Create and manage pull requests
- 📝 View and create commits
- 🌿 Manage branches
- 🏷️ Work with labels and milestones
- 🔍 Search code across repositories
- 📊 View repository insights
- ⚙️ Manage GitHub Actions workflows

## Security Best Practices

1. **Never commit** your `mcp.json` file with the token to version control
2. Add `.cursor/mcp.json` to your `.gitignore` file
3. Use **fine-grained tokens** with minimal required permissions when possible
4. **Rotate tokens** regularly
5. Consider using **environment variables** instead of hardcoding tokens

## Additional Resources

- [Official Cursor MCP Documentation](https://cursor.com/docs/context/mcp)
- [GitHub MCP Server Repository](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

## Need Help?

If you're still having issues:
1. Check Cursor's logs: Help → View Logs
2. Restart Cursor completely
3. Verify Node.js or Docker installation
4. Try regenerating your GitHub PAT with the correct scopes
5. Consult the Cursor Discord or GitHub Discussions

---

**Built for Bro-Verse-BuildSoul** | Sacred Construction | The Sentinel
