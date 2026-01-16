
export interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export interface UI {
    input(prompt: string): Promise<string | undefined>;
    select(prompt: string, options: string[] | { label: string; description?: string }[]): Promise<string | undefined>;
    confirm(message: string): Promise<boolean>;
    notify(message: string, type?: "info" | "warning" | "error"): void;
}

export interface ExtensionContext {
    exec(command: string, args: string[], options?: any): Promise<ExecResult>;
    ui: UI;
}

export interface ExtensionAPI {
    registerCommand(name: string, options: {
        description?: string;
        handler: (args: Record<string, any>, ctx: ExtensionContext) => Promise<void>;
    }): void;
    registerTool(tool: any): void;
    sendUserMessage(message: string, options?: { deliverAs?: "steer" }): void;
    sendMessage(message: any): void;
}
