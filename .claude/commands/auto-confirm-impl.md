---
name: auto-confirm
description: Toggle auto-confirmation mode for Claude Code actions
---

# Auto-Confirm Implementation

```bash
# Check current status and handle arguments
CONFIG_FILE=".claude/auto-confirm-config.json"
ARG="${1:-toggle}"

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << 'EOF'
{
  "enabled": false,
  "agentName": "auto-confirm",
  "version": "1.0.0",
  "lastModified": "",
  "description": "Configuration for Claude Code auto-confirmation behavior"
}
EOF
fi

# Read current status
CURRENT_STATUS=$(cat "$CONFIG_FILE" | grep '"enabled"' | sed 's/.*: *\([^,]*\).*/\1/' | tr -d ' "')

case "$ARG" in
    "on"|"enable"|"true")
        # Enable auto-confirm
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        cat > "$CONFIG_FILE" << EOF
{
  "enabled": true,
  "agentName": "auto-confirm",
  "version": "1.0.0",
  "lastModified": "$TIMESTAMP",
  "description": "Configuration for Claude Code auto-confirmation behavior"
}
EOF
        echo "✅ Auto-confirm mode ENABLED"
        echo "Claude Code will now proceed without asking for confirmation."
        echo "Use '/auto-confirm off' to disable."
        ;;
    "off"|"disable"|"false")
        # Disable auto-confirm
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        cat > "$CONFIG_FILE" << EOF
{
  "enabled": false,
  "agentName": "auto-confirm",
  "version": "1.0.0",
  "lastModified": "$TIMESTAMP",
  "description": "Configuration for Claude Code auto-confirmation behavior"
}
EOF
        echo "❌ Auto-confirm mode DISABLED"
        echo "Claude Code will ask for confirmation before actions."
        echo "Use '/auto-confirm on' to enable."
        ;;
    "status"|"check")
        # Show current status
        if [ "$CURRENT_STATUS" = "true" ]; then
            echo "✅ Auto-confirm mode is ENABLED"
            echo "Claude Code proceeds without asking for confirmation."
        else
            echo "❌ Auto-confirm mode is DISABLED"
            echo "Claude Code will ask for confirmation before actions."
        fi
        ;;
    "toggle"|*)
        # Toggle current state
        if [ "$CURRENT_STATUS" = "true" ]; then
            # Currently enabled, disable it
            TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            cat > "$CONFIG_FILE" << EOF
{
  "enabled": false,
  "agentName": "auto-confirm",
  "version": "1.0.0",
  "lastModified": "$TIMESTAMP",
  "description": "Configuration for Claude Code auto-confirmation behavior"
}
EOF
            echo "❌ Auto-confirm mode DISABLED"
            echo "Claude Code will ask for confirmation before actions."
        else
            # Currently disabled, enable it
            TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            cat > "$CONFIG_FILE" << EOF
{
  "enabled": true,
  "agentName": "auto-confirm",
  "version": "1.0.0",
  "lastModified": "$TIMESTAMP",
  "description": "Configuration for Claude Code auto-confirmation behavior"
}
EOF
            echo "✅ Auto-confirm mode ENABLED"
            echo "Claude Code will now proceed without asking for confirmation."
        fi
        ;;
esac

# Show usage if invalid argument
if [ "$ARG" != "on" ] && [ "$ARG" != "off" ] && [ "$ARG" != "status" ] && [ "$ARG" != "toggle" ] && [ "$ARG" != "enable" ] && [ "$ARG" != "disable" ] && [ "$ARG" != "true" ] && [ "$ARG" != "false" ] && [ "$ARG" != "check" ]; then
    echo "Usage: /auto-confirm [on|off|toggle|status]"
    echo "  on/enable/true  - Enable auto-confirmation"
    echo "  off/disable/false - Disable auto-confirmation"
    echo "  toggle          - Toggle current state (default)"
    echo "  status/check    - Show current status"
fi
```