import { ExtensionAPI } from "../types";
import { Assets } from "../lib/assets";
import { ProjectContext } from "../lib/context";

export function registerCreateRoadmap(pi: ExtensionAPI) {
    pi.registerCommand("gsd:create-roadmap", {
        description: "Create a step-by-step roadmap",
        handler: async (args, ctx) => {
            const assets = new Assets();
            const pCtx = new ProjectContext();

            if (!pCtx.exists("REQUIREMENTS.md")) {
                 ctx.ui.notify("Requirements not defined. Run /gsd:define-requirements first.", "error");
                 return;
            }

            const prompt = `
<objective>
Create a roadmap for the project based on requirements.
Break the work into phases (Phase 1, Phase 2, etc.).
</objective>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md

Template Roadmap:
${assets.readTemplate("roadmap.md")}

Template State:
${assets.readTemplate("state.md")}

Template Requirements:
${assets.readTemplate("requirements.md")}
</context>

<instructions>
1. Break down the requirements into logical phases.
2. Create .planning/ROADMAP.md using the template.
3. Create .planning/STATE.md using the template (initialize state).
4. Commit the changes.
</instructions>
`;
            pi.sendUserMessage(prompt, { deliverAs: "steer" });
        }
    });
}
