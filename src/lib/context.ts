import * as fs from "fs";
import * as path from "path";

export class ProjectContext {
    private planningDir = ".planning";

    constructor() {}

    ensurePlanningDir() {
        if (!fs.existsSync(this.planningDir)) {
            fs.mkdirSync(this.planningDir, { recursive: true });
        }
    }

    getPath(filename: string) {
        return path.join(this.planningDir, filename);
    }

    exists(filename: string): boolean {
        return fs.existsSync(this.getPath(filename));
    }

    read(filename: string): string | null {
        if (!this.exists(filename)) return null;
        return fs.readFileSync(this.getPath(filename), "utf8");
    }

    write(filename: string, content: string) {
        this.ensurePlanningDir();
        // Ensure parent dir exists if filename contains slashes
        const fullPath = this.getPath(filename);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, "utf8");
    }

    readConfig(): any {
        const content = this.read("config.json");
        return content ? JSON.parse(content) : null;
    }

    writeConfig(config: any) {
        this.write("config.json", JSON.stringify(config, null, 2));
    }

    listFiles(subdir: string = ""): string[] {
        const targetDir = path.join(this.planningDir, subdir);
        if (!fs.existsSync(targetDir)) return [];
        return fs.readdirSync(targetDir);
    }
}
