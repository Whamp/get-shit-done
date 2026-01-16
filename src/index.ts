import { ExtensionAPI } from "./types";
import { registerNewProject } from "./commands/new-project";
import { registerDefineRequirements } from "./commands/define-requirements";
import { registerCreateRoadmap } from "./commands/create-roadmap";
import { registerPlanPhase } from "./commands/plan-phase";
import { registerExecutePhase } from "./commands/execute-phase";

export default function(pi: ExtensionAPI) {
    registerNewProject(pi);
    registerDefineRequirements(pi);
    registerCreateRoadmap(pi);
    registerPlanPhase(pi);
    registerExecutePhase(pi);
}
