# Migration Guide: Setting up GSD with Pi

This guide explains how to install and configure the GSD extension for Pi Coding Agent.

## Prerequisites

1.  **Install Pi Coding Agent**:
    ```bash
    npm install -g @mariozechner/pi-coding-agent
    ```
2.  **Configure Models**: Ensure you have valid API keys for your preferred LLM (Anthropic Claude 3.5 Sonnet is recommended for GSD).

## Installation

Since GSD is now implemented as a Pi Extension, you need to add the extension code to your Pi configuration.

1.  **Create the Extension Directory**:
    ```bash
    mkdir -p ~/.pi/agent/extensions/gsd
    ```

2.  **Copy Extension Code**:
    Copy the TypeScript files (defined in `specs/02-implementation-details.md`) into `~/.pi/agent/extensions/gsd/`.
    *   `index.ts`
    *   `commands/`
    *   `lib/`

3.  **Install Dependencies** (if using external packages):
    Inside `~/.pi/agent/extensions/gsd/`:
    ```bash
    npm init -y
    npm install @sinclair/typebox
    ```

4.  **Verify Installation**:
    Run `pi` and check the help output or run a command:
    ```bash
    pi -p "check commands"
    # Output should list /gsd:new-project etc.
    ```

## Project Setup

To start using GSD in a new or existing repository:

1.  **Navigate to your project**:
    ```bash
    cd my-app
    ```

2.  **Initialize GSD**:
    ```bash
    pi
    > /gsd:new-project
    ```
    Follow the interactive prompts to define your project vision.

3.  **Verify Context**:
    Check that `.planning/PROJECT.md` has been created.

## Workflow Example

1.  **Plan a Phase**:
    ```bash
    > /gsd:plan-phase 1
    ```
    The agent will generate `01-setup-PLAN.md` files.

2.  **Execute Phase**:
    ```bash
    > /gsd:execute-phase 1
    ```
    The agent will spawn sub-processes to execute the plans.

## Migrating from Claude Code

If you were previously using the original GSD with Claude Code:

1.  **Keep your `.planning/` folder**: Pi-GSD uses the same file structure (`PROJECT.md`, `STATE.md`). You don't need to rewrite them.
2.  **Delete `.claude/`**: You no longer need the Claude Code configuration or command definitions.
3.  **Update References**: If you have custom prompts referencing `~/.claude/...`, update them to point to your new extension paths or project-local paths.

## Troubleshooting

*   **Subagent Failures**: If subagents fail to run, ensure `pi` is in your global PATH.
*   **Context Issues**: If the agent seems to forget things, check that `pi.sendMessage` in the extension is correctly loading `STATE.md`.
