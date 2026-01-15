# Get Shit Done (GSD): A Beginner's Guide

## What is GSD?

**Get Shit Done (GSD)** is a meta-prompting and context engineering system designed to make AI coding agents (specifically Claude Code) more reliable and effective for complex software projects.

Normally, when you ask an AI to "build an app", it might start well but eventually lose track of details, hallucinate, or produce inconsistent code as its "context window" (memory) fills up. GSD solves this by breaking projects down into manageable pieces and managing what the AI knows at any given time.

## Why Use It?

*   **Prevents "Context Rot"**: As conversations get long, AI performance degrades. GSD keeps context fresh by splitting work into small, independent tasks.
*   **Spec-Driven Development**: It forces you (and the AI) to define *what* to build before writing code, leading to better architecture.
*   **Automated Workflow**: It automates the boring parts of project management (creating issues, tracking progress, writing commits).

## How It Works: The 5-Step Flow

GSD follows a strict workflow to ensure quality.

### 1. New Project (`/gsd:new-project`)
The system interviews you about your idea. It asks clarifying questions until it understands your goals, constraints, and tech stack.
*   **Output**: `.planning/PROJECT.md` (The "Vision" of the project).

### 2. Research (`/gsd:research-project`)
Before coding, the system spawns agents to research the best tools and patterns for your specific problem. It looks up documentation, libraries, and common pitfalls.
*   **Output**: `.planning/research/` (Knowledge base for the project).

### 3. Requirements & Roadmap (`/gsd:define-requirements`, `/gsd:create-roadmap`)
The AI defines a list of requirements (Must Haves, Should Haves) and creates a step-by-step roadmap to build them.
*   **Output**:
    *   `REQUIREMENTS.md`: Traceable list of features.
    *   `ROADMAP.md`: Phases of development (e.g., Phase 1: Setup, Phase 2: Auth).
    *   `STATE.md`: A living document of the project's current status.

### 4. Planning a Phase (`/gsd:plan-phase`)
When you're ready to build a phase (e.g., "Phase 1"), the system breaks it down into small, atomic "Task Plans". Each plan is a specific instruction set for a sub-agent.
*   **Output**: `01-setup-repo-PLAN.md`, `02-install-deps-PLAN.md`, etc.

### 5. Execution (`/gsd:execute-phase`)
This is where the magic happens. The system executes the plans.
*   **Subagents**: For each plan, GSD spawns a **fresh** sub-agent. This agent has zero memory of previous tasks—it only knows the project context and its specific plan. This ensures maximum intelligence and focus.
*   **Verification**: After coding, the agent verifies its work (e.g., runs tests, checks endpoints).
*   **Atomic Commits**: Each task results in a clean, descriptive git commit.

## Key Concepts

### Context Engineering
GSD carefully controls what files are loaded into the AI's context.
*   **Global Context**: `PROJECT.md` and `STATE.md` are always available.
*   **Local Context**: Specific code files are only loaded when needed for a specific task.
This keeps the AI "smart" by not overloading it with irrelevant information.

### Subagents
A "subagent" is a temporary AI session dedicated to a single task. Once the task is done, the session is destroyed. This prevents the AI from getting confused by previous conversation history.

### Files as Memory
Instead of relying on the chat history (which disappears), GSD stores everything in markdown files in the `.planning/` directory. This serves as the "long-term memory" of the project.
