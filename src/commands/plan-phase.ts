import { ExtensionAPI } from "../types";
import { Assets } from "../lib/assets";
import { ProjectContext } from "../lib/context";

export function registerPlanPhase(pi: ExtensionAPI) {
    pi.registerCommand("gsd:plan-phase", {
        description: "Generate atomic task plans for a phase",
        handler: async (args, ctx) => {
            const assets = new Assets();
            const pCtx = new ProjectContext();

            // Extract phase number from args or prompt
            let phase = args["phase"];
            if (!phase) {
                phase = await ctx.ui.input("Which phase number do you want to plan?");
            }

            if (!phase) return;

            if (!pCtx.exists("ROADMAP.md")) {
                 ctx.ui.notify("Roadmap not found.", "error");
                 return;
            }

            // Detect gaps flag
            // We assume args might come as { phase: "1", gaps: true } or similar
            const isGapMode = args["gaps"] === true;

            const prompt = `
<objective>
Execute the Plan Phase workflow for Phase ${phase}.
${isGapMode ? "GAP CLOSURE MODE: Plan gap closure tasks based on verification failures." : "Standard Planning Mode."}
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md

Workflow:
${assets.readWorkflow("plan-phase.md")}

Plan Format:
${assets.readReference("plan-format.md")}

Phase Prompt Template:
${assets.readTemplate("phase-prompt.md")}

Scope Estimation Reference:
${assets.readReference("scope-estimation.md")}

Checkpoints Reference:
${assets.readReference("checkpoints.md")}

TDD Reference:
${assets.readReference("tdd.md")}
</context>

<instructions>
1. Follow the <process> defined in the Workflow context.
2. Step 'identify_phase': The user has selected Phase ${phase}.
3. Create the necessary directories and PLAN.md files.
4. Commit the results.
</instructions>
`;
            pi.sendUserMessage(prompt, { deliverAs: "steer" });
        }
    });
}
