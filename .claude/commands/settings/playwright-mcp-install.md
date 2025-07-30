# For E2E test

Installs and configures Playwright MCP server for Claude Code with browser automation capabilities.

## What this command does

1. **Installs Playwright MCP Server**: Adds browser automation capabilities to Claude Code
2. **Configures MCP Server**: Sets up the connection for immediate use
3. **Verifies Installation**: Confirms the setup is working correctly

## Installation Steps

### Step 1: Install Playwright MCP Server Package
```bash
npm install -g @executeautomation/playwright-mcp-server
```

### Step 2: Add MCP Server to Claude Code
Run the following command to add Playwright MCP server to your project:

```bash
claude mcp add playwright-server -s project -- npx @executeautomation/playwright-mcp-server
```

### Step 3: Alternative Installation Methods

**Option A: Microsoft's Official Playwright MCP**
```bash
claude mcp add playwright-ms -s project -- npx @playwright/mcp@latest
```

**Option B: Using Smithery (Automatic Configuration)**
```bash
npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude
```

**Option C: Manual Configuration**
If you prefer manual setup, add this to your `.mcp.json` file:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"]
  }
}
```

### Step 4: Verify Installation
After installation, restart Claude Code and check if MCP tools are available:
```bash
/mcp
```

You should see Playwright-related tools in the list.

## Available Playwright MCP Tools

Once installed, you'll have access to:
- **Browser Navigation**: Navigate to URLs, handle page interactions
- **Element Interaction**: Click, type, select elements
- **Screenshot Capture**: Take screenshots for verification
- **Accessibility Tree**: Access structured page data without screenshots
- **JavaScript Execution**: Run custom scripts in browser context
- **API Testing**: Validate endpoints and responses

## Usage Examples

After installation, you can use commands like:
- "Navigate to https://example.com and take a screenshot"
- "Fill the login form and submit"
- "Take a screenshot of the current page"
- "Execute this JavaScript on the page"

## Browser Support

Playwright MCP supports:
- **Chromium** (default)
- **Firefox** 
- **WebKit** (Safari)

## Configuration Options

**Headless Mode** (default):
```bash
claude mcp add playwright --browser-headless true
```

**Headed Mode** (visible browser):
```bash
claude mcp add playwright --browser-headless false
```

**Persistent Profile**:
```bash
claude mcp add playwright --user-data-dir ./browser-profile
```

## Troubleshooting

If installation fails:
1. Ensure Node.js is installed (`node --version`)
2. Check if you have proper permissions
3. Try installing without global flag: `npm install @executeautomation/playwright-mcp-server`
4. Use `claude mcp remove playwright` and reinstall

## Security Note

Playwright MCP can control browsers and access websites. Use with trusted sources and be mindful of:
- Credential exposure
- Automated interactions on production sites
- Rate limiting and terms of service

---
