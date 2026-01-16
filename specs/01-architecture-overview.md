# Architecture Overview: GSD on Pi

This document outlines the architectural approach for porting the "Get Shit Done" (GSD) system from Claude Code to the Pi Coding Agent.

## Goal
The goal is to implement GSD as a **Pi Extension**, leveraging Pi's native extension capabilities (`pi.registerCommand`, `pi.registerTool`, lifecycle events) to replicate the meta-prompting and context engineering workflows of GSD.

## Component Mapping

| GSD Concept | Claude Code Implementation | Pi Agent Implementation |
| :--- | :--- | :--- |
| **Commands** | Markdown files in `commands/gsd/*.md` | `pi.registerCommand()` in TypeScript extension |
| **Workflows** | Markdown files in `workflows/*.md` (Meta-prompts) | TypeScript "Workflow Engine" that parses/executes MD files OR native TypeScript logic |
| **Context** | `@filename` references | Native Pi `@filename` support + `pi.sendMessage` for injection |
| **User Input** | `AskUserQuestion` tool | `ctx.ui.select`, `ctx.ui.confirm`, `ctx.ui.input` |
| **Subagents** | `Task` tool | `pi.exec` spawning new `pi` CLI instances OR `ctx.newSession` (if supported) |
| **State** | `.planning/*.md` files | Same (File-based state is portable) |

## Core Components

### 1. The GSD Extension (`gsd-pi.ts`)
This is the entry point. It will:
*   Register all `/gsd:*` commands.
*   Listen for lifecycle events (e.g., to auto-load `PROJECT.md` context).
*   Register custom tools needed for GSD (if any are missing from Pi).

### 2. The Workflow Engine
GSD relies heavily on "executable markdown" (XML tags within Markdown). To port this, we have two options:
*   **A: Port to Code**: Rewrite every GSD workflow (e.g., `new-project.md`) as a pure TypeScript function.
    *   *Pros*: Type-safe, easier to debug, full access to Pi API.
    *   *Cons*: Loses the "prompt-driven" nature; harder to update logic by just editing text.
*   **B: Markdown Interpreter**: Build a lightweight engine in the extension that reads the existing GSD markdown files, extracts the `<step>` tags, and executes them by feeding prompts to Pi.
    *   *Pros*: Reuses existing GSD logic/prompts.
    *   *Cons*: Complex to implement the interpreter.

**Decision**: We will use **Hybrid Approach (Option A+)**. We will implement the control flow (loops, user interaction, file checks) in TypeScript, but use the *content* of the GSD markdown files as the prompts sent to the agent.

### 3. Subagent Orchestrator
GSD's power comes from running tasks in fresh contexts.
*   The Orchestrator will use `pi.exec` to spawn `pi` subprocesses for atomic tasks.
*   Example: `pi.exec("pi", ["-p", "@01-plan.md", "Execute this plan"])`
*   This ensures true isolation, matching GSD's "fresh context" philosophy.

### 4. Context Manager
Pi supports `@file` syntax natively. The extension will programmatically inject these references.
*   When a workflow starts, the extension will detect required context (e.g., `@PROJECT.md`) and append it to the session using `pi.sendMessage`.

## Data Flow

1.  **User** runs `/gsd:new-project`.
2.  **Extension** triggers the `newProject` handler.
3.  **Handler** checks for `.planning/PROJECT.md`.
4.  **Handler** uses `ctx.ui` to ask the user "What do you want to build?".
5.  **Handler** constructs a prompt combining `templates/project.md` and user input.
6.  **Handler** sends prompt to **Pi Agent**.
7.  **Pi Agent** generates `PROJECT.md`.
8.  **Handler** saves the file (or Pi saves it via `write` tool).
9.  **Handler** commits changes via `pi.exec("git", ...)` .

## Directory Structure

The GSD logic will live in `.pi/extensions/gsd/`:

```text
.pi/extensions/gsd/
├── index.ts              # Entry point, registers commands
├── commands/             # Implementation of each /gsd command
│   ├── new-project.ts
│   ├── plan-phase.ts
│   └── execute-phase.ts
├── lib/
│   ├── workflow-runner.ts # Helpers to run agent steps
│   ├── context.ts         # Helpers to load/manage .planning files
│   └── git.ts             # Git automation helpers
└── prompts/              # Raw markdown prompts (ported from GSD)
```
