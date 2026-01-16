import { ExtensionAPI, ExtensionContext } from "../types";
import { Git } from "../lib/git";
import { ProjectContext } from "../lib/context";
import { GSDUI } from "../lib/ui";
import { Assets } from "../lib/assets";
import * as fs from "fs";

export function registerNewProject(pi: ExtensionAPI) {
    pi.registerCommand("gsd:new-project", {
        description: "Initialize a new project with deep context gathering",
        handler: async (args, ctx) => {
            const git = new Git(ctx);
            const pCtx = new ProjectContext();
            const ui = new GSDUI(ctx);
            const assets = new Assets();

            // 1. Check if project exists
            if (pCtx.exists("PROJECT.md")) {
                ui.notify("Project already initialized. Use /gsd:progress", "error");
                return;
            }

            // 2. Initialize Git
            if (!await git.isRepo()) {
                await git.init();
                ui.notify("Initialized new git repo", "info");
            }

            // 3. Brownfield Detection
            let isBrownfield = false;
            if (fs.existsSync("package.json") || fs.existsSync("requirements.txt") || fs.existsSync("go.mod") || fs.existsSync("Cargo.toml")) {
                isBrownfield = true;
            }

            if (isBrownfield && !pCtx.exists("codebase/STACK.md")) {
                const choice = await ui.select("I detected existing code. Would you like to map the codebase first?", [
                    { label: "Map codebase first", description: "Run /gsd:map-codebase (Recommended)" },
                    { label: "Skip mapping", description: "Proceed with project initialization" }
                ]);

                if (choice === "Map codebase first") {
                    ui.notify("Please run /gsd:map-codebase first, then return here.", "info");
                    return;
                }
            }

            // 4. User Interview - Initial Question
            const idea = await ui.ask("What do you want to build?");
            if (!idea) return;

            // 5. Load Templates and References
            const projectTemplate = assets.readTemplate("project.md");
            const configTemplate = assets.readTemplate("config.json");
            const principles = assets.readReference("principles.md");
            const questioning = assets.readReference("questioning.md");

            // 6. Construct Prompt
            const prompt = `
<objective>
Initialize a new project through comprehensive context gathering.
The user wants to build: "${idea}"

Your goal is to create .planning/PROJECT.md and .planning/config.json.
</objective>

<context>
Principles:
${principles}

Questioning Techniques:
${questioning}

Project Template:
${projectTemplate}

Config Template:
${configTemplate}
</context>

<instructions>
1. Ask follow-up questions to understand the user's vision, goals, and constraints. Use the questioning techniques.
2. Once you have enough information, create .planning/PROJECT.md using the template.
   - If this is a brownfield project (existing code), infer validated requirements from it.
   - If greenfield, requirements are hypotheses.
3. Ask the user for workflow preferences (Mode, Depth, Parallelization) using the 'ask_user' tool or plain text questions.
   - Mode: YOLO (Auto-approve) vs Interactive
   - Depth: Quick vs Standard vs Comprehensive
   - Execution: Parallel vs Sequential
4. Create .planning/config.json with the chosen preferences.
5. Commit the changes using git (docs: initialize [project-name]).
6. Inform the user of next steps (Research or Define Requirements).
</instructions>
`;

            // 7. Send to Agent
            pi.sendUserMessage(prompt, { deliverAs: "steer" });
        }
    });
}
