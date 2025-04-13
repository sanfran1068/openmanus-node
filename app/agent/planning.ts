import { ToolCallAgent } from "./toolcall";
import { PlanningTool } from "../tool/planning";
import { Terminate } from "../tool/terminate";
import { ToolCollection } from "../tool/base";

/** PlanningAgent: an agent that incorporates a PlanningTool for task planning */
export class PlanningAgent extends ToolCallAgent {
  constructor(options: any = {}) {
    super({
      name: "PlanningAgent",
      description: "Agent that can create and follow plans for complex tasks",
      ...options
    });
    // Ensure PlanningTool is in the toolset
    if (!this["available_tools"]) {
      this["available_tools"] = new ToolCollection(new PlanningTool(), new Terminate());
    } else {
      // Add PlanningTool and Terminate if not already present
      const tools = this["available_tools"].tools;
      const hasPlanning = tools.find(t => t.name === "planning");
      if (!hasPlanning) {
        tools.push(new PlanningTool());
      }
      const hasTerminate = tools.find(t => t.name === "terminate");
      if (!hasTerminate) {
        tools.push(new Terminate());
      }
      this["available_tools"] = new ToolCollection(...tools);
    }
  }
}
