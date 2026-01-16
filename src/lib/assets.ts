import * as fs from "fs";
import * as path from "path";

export class Assets {
    private assetsDir: string;

    constructor() {
        // We assume we are in src/lib/ or dist/lib/
        // So assets is at ../assets
        this.assetsDir = path.join(__dirname, "..", "assets");
    }

    readTemplate(name: string): string {
        return fs.readFileSync(path.join(this.assetsDir, "templates", name), "utf8");
    }

    readReference(name: string): string {
        return fs.readFileSync(path.join(this.assetsDir, "references", name), "utf8");
    }

    readWorkflow(name: string): string {
        return fs.readFileSync(path.join(this.assetsDir, "workflows", name), "utf8");
    }
}
