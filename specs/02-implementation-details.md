# Implementation Details

This document details the code structure and API usage for implementing GSD as a Pi Extension.

## 1. Extension Setup (`index.ts`)

The extension must be initialized with `pi.registerCommand`.

```typescript
// .pi/extensions/gsd/index.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerNewProject } from "./commands/new-project";
import { registerPlanPhase } from "./commands/plan-phase";
import { registerExecutePhase } from "./commands/execute-phase";

export default function(pi: ExtensionAPI) {
    // Register all GSD commands
    registerNewProject(pi);
    registerPlanPhase(pi);
    registerExecutePhase(pi);

    // Register GSD-specific tools if needed
    // pi.registerTool(...)
}
```

## 2. Command Implementation

Each command should be its own module. We replace the GSD markdown workflows with TypeScript logic that interacts with the user and the agent.

### Example: `/gsd:new-project`

```typescript
// .pi/extensions/gsd/commands/new-project.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

export function registerNewProject(pi: ExtensionAPI) {
    pi.registerCommand("gsd:new-project", {
        description: "Initialize a new project with deep context gathering",
        handler: async (args, ctx) => {
            // 1. Check if project exists
            if (fs.existsSync(".planning/PROJECT.md")) {
                ctx.ui.notify("Project already initialized. Use /gsd:progress", "error");
                return;
            }

            // 2. Initialize Git
            if (!fs.existsSync(".git")) {
                await ctx.exec("git", ["init"]);
                ctx.ui.notify("Initialized new git repo", "info");
            }

            // 3. User Interview
            const idea = await ctx.ui.input("What do you want to build?");
            if (!idea) return;

            // 4. Construct Prompt
            // We load the GSD template (or hardcode it for simplicity in v1)
            const prompt = `
            You are an expert software architect.
            The user wants to build: "${idea}"

            Your goal is to create a .planning/PROJECT.md file.
            Follow this structure:
            - Vision
            - Core Features (Validated, Active, Out of Scope)
            - Tech Stack
            - Key Decisions

            Ask clarifying questions if the user's idea is too vague.
            Once you have enough info, write the file using the 'write' tool.
            `;

            // 5. Send to Agent
            // 'steer' means interrupt current work and focus on this.
            pi.sendUserMessage(prompt, { deliverAs: "steer" });
        }
    });
}
```

## 3. Subagent Execution

GSD relies on "fresh context" subagents. In Pi, we achieve this by spawning a new Pi process in "print mode" (`-p`) or "headless mode" (`--no-session`) for each task.

### The Subagent Runner

```typescript
// .pi/extensions/gsd/lib/runner.ts
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export async function runSubagent(
    ctx: ExtensionContext,
    planFile: string,
    instruction: string
) {
    // Construct the command
    // pi -p @plan.md "Instruction" --no-session
    const args = [
        "-p",               // Print mode (non-interactive, runs until done)
        "--no-session",     // Don't save session history (fresh context)
        `@${planFile}`,     // Load the plan file context
        instruction         // The actual task instruction
    ];

    ctx.ui.notify(`Starting subagent for ${planFile}...`, "info");

    // Execute the Pi CLI recursively
    // Note: Ensure 'pi' is in PATH or use absolute path
    const result = await ctx.exec("pi", args);

    if (result.exitCode !== 0) {
        ctx.ui.notify(`Subagent failed: ${result.stderr}`, "error");
        throw new Error(`Subagent failed for ${planFile}`);
    }

    return result.stdout;
}
```

## 4. Tool Mapping

GSD workflows use tools like `AskUserQuestion` and `Task`.

| GSD Tool | Pi Equivalent | Implementation |
| :--- | :--- | :--- |
| `AskUserQuestion` | `ctx.ui` | `await ctx.ui.select(...)` or `ctx.ui.input(...)` |
| `Task` | `pi.exec` | See "Subagent Execution" above |
| `Bash` | `bash` (Built-in) | Native |
| `Read` | `read` (Built-in) | Native |
| `Write` | `write` (Built-in)| Native |

### Implementing `AskUserQuestion` behavior inside the Agent

If the *Agent* needs to ask a question (not the command handler), Pi supports this naturally. The agent can just output text. However, for structured questions, we might want to register a specific tool:

```typescript
pi.registerTool({
    name: "ask_user",
    description: "Ask the user a question and get a response",
    parameters: Type.Object({
        question: Type.String(),
        options: Type.Optional(Type.Array(Type.String()))
    }),
    async execute(id, params, onUpdate, ctx) {
        if (params.options) {
            const answer = await ctx.ui.select(params.question, params.options);
            return { content: [{ type: "text", text: answer || "No selection" }] };
        } else {
            const answer = await ctx.ui.input(params.question);
            return { content: [{ type: "text", text: answer || "" }] };
        }
    }
});
```

## 5. Context Injection

To replicate GSD's `@~/.claude/...` references, we can simply ensure our prompts use Pi's native `@file` syntax.

When a command starts, we can also inject context programmatically:

```typescript
// Inject STATE.md content into the session
const stateContent = fs.readFileSync(".planning/STATE.md", "utf8");
pi.sendMessage({
    customType: "project-state",
    content: `Current Project State:\n${stateContent}`,
    display: false // Hide from UI to reduce clutter, but Agent sees it
});
```
