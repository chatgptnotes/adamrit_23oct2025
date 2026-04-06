# Adamrit zip 31march2026

## Project Overview

**Languages:** python, typescript
**Frameworks:** nextjs, react
**Primary:** nextjs

## Code Style

- Linter: ruff or flake8
- Formatter: black or ruff format
- Type checking: mypy or pyright

## Testing

- Test framework: pytest
- Run tests: `pytest`
- Coverage: `pytest --cov`

## Security

- No hardcoded secrets — use environment variables
- Validate all user inputs
- Parameterized queries for database access

## Ironbark

This project uses automatic skill harvesting powered by the Ironbark learning loop.

- **Auto-harvest**: After complex sessions (15+ tool calls), you'll be nudged to run `/ironbark`
- **Manual harvest**: Run `/ironbark` at any time to extract reusable patterns from the current session
- **Cross-project**: Skills are saved to `~/.claude/skills/harvested/` and shared across all projects
- **What gets harvested**: Non-trivial approaches, trial-and-error discoveries, debugging patterns, integration quirks
- **Existing skills**: `/learn`, `/learn-eval`, and instincts continue working alongside Ironbark
