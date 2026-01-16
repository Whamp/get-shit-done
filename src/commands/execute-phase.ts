import { ExtensionAPI } from "../types";
import { Assets } from "../lib/assets";
import { ProjectContext } from "../lib/context";
import { SubagentRunner } from "../lib/runner";
import * as path from "path";
import * as fs from "fs";

export function registerExecutePhase(pi: ExtensionAPI) {
    pi.registerCommand("gsd:execute-phase", {
        description: "Execute all plans in a phase with wave-based parallelization",
        handler: async (args, ctx) => {
            const runner = new SubagentRunner(ctx);
            const pCtx = new ProjectContext();
            const assets = new Assets();
            const ui = ctx.ui;

            let phase = args["phase"];
            if (!phase) {
                phase = await ui.input("Which phase number do you want to execute?");
            }
            if (!phase) return;

            // 1. Find phase directory
            // We look for .planning/phases/{phase}-*
            const phasesDir = pCtx.getPath("phases");
            if (!fs.existsSync(phasesDir)) {
                ui.notify("No phases found.", "error");
                return;
            }

            const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
            const phaseDirEntry = entries.find(e => e.isDirectory() && (e.name.startsWith(`${phase}-`) || e.name === phase));

            if (!phaseDirEntry) {
                ui.notify(`Phase ${phase} not found.`, "error");
                return;
            }

            const phasePath = path.join(phasesDir, phaseDirEntry.name);
            const planFiles = fs.readdirSync(phasePath).filter(f => f.endsWith("-PLAN.md"));

            if (planFiles.length === 0) {
                ui.notify("No plans found in phase.", "error");
                return;
            }

            // 2. Group by wave
            const plansByWave: Record<number, string[]> = {};

            for (const file of planFiles) {
                const content = fs.readFileSync(path.join(phasePath, file), "utf8");
                const waveMatch = content.match(/wave:\s*(\d+)/);
                const wave = waveMatch ? parseInt(waveMatch[1]) : 1;

                if (!plansByWave[wave]) plansByWave[wave] = [];
                plansByWave[wave].push(file);
            }

            const waves = Object.keys(plansByWave).map(Number).sort((a, b) => a - b);

            ui.notify(`Found ${planFiles.length} plans in ${waves.length} waves.`, "info");

            // Pre-load execution context assets
            const execContext = `
<execution_context>
Execute Plan Workflow:
${assets.readWorkflow("execute-plan.md")}

Summary Template:
${assets.readTemplate("summary.md")}

Checkpoints Reference:
${assets.readReference("checkpoints.md")}

TDD Reference:
${assets.readReference("tdd.md")}
</execution_context>
`;

            // 3. Execute waves
            for (const wave of waves) {
                ui.notify(`Executing Wave ${wave}...`, "info");
                const plans = plansByWave[wave];

                // Run in parallel
                try {
                    await Promise.all(plans.map(async (planFile) => {
                        const fullPath = path.join(phasePath, planFile);
                        const relPath = path.relative(process.cwd(), fullPath); // Use relative path for @ references

                        // Check if SUMMARY exists (already done)
                        const summaryFile = planFile.replace("-PLAN.md", "-SUMMARY.md");
                        if (fs.existsSync(path.join(phasePath, summaryFile))) {
                            ui.notify(`Plan ${planFile} already complete (SUMMARY exists). Skipping.`, "info");
                            return;
                        }

                        ui.notify(`Starting ${planFile}...`, "info");
                        await runner.run(relPath, `Execute the plan defined in @${relPath}. create ${summaryFile} when done.\n\n${execContext}`, {
                            additionalContext: [".planning/STATE.md", ".planning/PROJECT.md"]
                        });
                        ui.notify(`Plan ${planFile} complete.`, "info");
                    }));
                } catch (e: any) {
                    ui.notify(`Wave ${wave} failed: ${e.message}`, "error");
                    throw e;
                }

                ui.notify(`Wave ${wave} complete.`, "info");
            }

            ui.notify("All waves executed. Verifying phase...", "info");

            // 4. Verify Phase (Placeholder for now, or we could spawn a verifier agent)
            // For a full implementation, we'd spawn another agent here to check requirements.

            ui.notify(`Phase ${phase} execution complete! Run /gsd:verify-work to verify.`, "info");
        }
    });
}
