import { ExtensionAPI } from "../types";
import { Assets } from "../lib/assets";
import { ProjectContext } from "../lib/context";

export function registerDefineRequirements(pi: ExtensionAPI) {
    pi.registerCommand("gsd:define-requirements", {
        description: "Define v1, v2, and out-of-scope requirements",
        handler: async (args, ctx) => {
            const assets = new Assets();
            const pCtx = new ProjectContext();

            if (!pCtx.exists("PROJECT.md")) {
                 ctx.ui.notify("Project not initialized. Run /gsd:new-project first.", "error");
                 return;
            }

            const prompt = `
<objective>
Define detailed requirements for the project based on PROJECT.md.
Scope them into Validated (if brownfield), v1 (MVP), v2 (Future), and Out of Scope.
</objective>

<context>
@.planning/PROJECT.md
${pCtx.exists("codebase/STACK.md") ? "@.planning/codebase/" : ""}
${pCtx.exists("research/") ? "@.planning/research/" : ""}

Template:
${assets.readTemplate("requirements.md")}
</context>

<instructions>
1. Analyze the project vision and constraints.
2. Define a list of requirements.
3. Categorize them.
4. Create .planning/REQUIREMENTS.md using the template.
5. Commit the changes.
</instructions>
`;
            pi.sendUserMessage(prompt, { deliverAs: "steer" });
        }
    });
}
