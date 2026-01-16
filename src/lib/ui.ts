import { ExtensionContext, UI } from "../types";

export interface QuestionOption {
    label: string;
    description?: string;
}

export class GSDUI {
    private ui: UI;

    constructor(ctx: ExtensionContext) {
        this.ui = ctx.ui;
    }

    async ask(question: string): Promise<string | undefined> {
        return this.ui.input(question);
    }

    async select(question: string, options: (string | QuestionOption)[]): Promise<string | undefined> {
        // Normalize options to match what the underlying UI expects if needed.
        // Assuming the underlying UI handles both strings and objects with label/description.
        return this.ui.select(question, options as any);
    }

    notify(message: string, type: "info" | "warning" | "error" = "info") {
        this.ui.notify(message, type);
    }

    async confirm(message: string): Promise<boolean> {
        return this.ui.confirm(message);
    }
}
