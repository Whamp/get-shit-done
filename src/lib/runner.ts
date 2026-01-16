import { ExtensionContext } from "../types";

export class SubagentRunner {
    constructor(private ctx: ExtensionContext) {}

    async run(planFile: string, instruction: string, options: { additionalContext?: string[] } = {}): Promise<string> {
        const args = [
            "-p",               // Print mode (non-interactive, runs until done)
            "--no-session",     // Don't save session history (fresh context)
        ];

        // Add plan context
        args.push(`@${planFile}`);

        // Add additional context
        if (options.additionalContext) {
            for (const context of options.additionalContext) {
                args.push(`@${context}`);
            }
        }

        // Add instruction
        args.push(instruction);

        this.ctx.ui.notify(`Starting subagent for ${planFile}...`, "info");

        // Execute the Pi CLI recursively
        // We assume 'pi' is in the PATH or the environment where the extension runs
        const result = await this.ctx.exec("pi", args);

        if (result.exitCode !== 0) {
            this.ctx.ui.notify(`Subagent failed: ${result.stderr}`, "error");
            throw new Error(`Subagent failed for ${planFile}: ${result.stderr}`);
        }

        return result.stdout;
    }
}
