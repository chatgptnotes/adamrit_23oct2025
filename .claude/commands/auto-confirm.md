# Auto-Confirm Command

Enable or disable auto-confirmation mode for Claude Code actions.

## Usage

```bash
/auto-confirm [on|off|status]
```

## Arguments

- `on` - Enable auto-confirmation mode
- `off` - Disable auto-confirmation mode  
- `status` - Show current auto-confirmation status
- No argument - Toggle current state

## Examples

```bash
/auto-confirm on     # Enable auto-confirm
/auto-confirm off    # Disable auto-confirm
/auto-confirm        # Toggle current state
/auto-confirm status # Check current status
```

## What it does

When auto-confirm is enabled:
- Claude Code will not ask for confirmation before performing actions
- The auto-confirm agent will handle all confirmation requests automatically
- Actions proceed with sensible defaults and best practices
- Reduces friction for experienced users who trust Claude's decision-making

When auto-confirm is disabled:
- Normal confirmation behavior is restored
- Claude Code will ask before performing potentially impactful actions
- Standard interactive mode is maintained

## Configuration

Auto-confirm settings are stored in `.claude/settings.local.json` and persist across sessions.