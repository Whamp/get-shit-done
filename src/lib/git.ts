import { ExtensionContext } from "../types";

export class Git {
    constructor(private ctx: ExtensionContext) {}

    async isRepo(): Promise<boolean> {
        // Check if .git directory exists
        const result = await this.ctx.exec("test", ["-d", ".git"]);
        return result.exitCode === 0;
    }

    async init(): Promise<void> {
        await this.ctx.exec("git", ["init"]);
    }

    async add(files: string[]): Promise<void> {
        if (files.length === 0) return;
        await this.ctx.exec("git", ["add", ...files]);
    }

    async commit(message: string): Promise<void> {
        await this.ctx.exec("git", ["commit", "-m", message]);
    }

    async status(): Promise<string> {
        const result = await this.ctx.exec("git", ["status", "--porcelain"]);
        return result.stdout;
    }

    async getBranch(): Promise<string> {
        const result = await this.ctx.exec("git", ["branch", "--show-current"]);
        return result.stdout.trim();
    }
}
