import { BaseFlow } from "./base";
import { Manus } from "../agent/manus";
import { PlanningTool } from "../tool/planning";
import { AgentState } from "../agent/base";

/** PlanningFlow: orchestrates planning and executing a task in multiple steps */
export class PlanningFlow extends BaseFlow {
  private agent: Manus;
  private planningTool: PlanningTool;

  constructor() {
    super();
    // Use a Manus agent for planning and execution
    this.agent = new Manus();
    // Extract the PlanningTool from the agent's tools
    const tool = this.agent["available_tools"].toolMap["planning"];
    if (!tool || !(tool instanceof PlanningTool)) {
      // Ensure agent has a planning tool
      this.agent["available_tools"].tools.push(new PlanningTool());
    }
    this.planningTool = this.agent["available_tools"].toolMap["planning"] as PlanningTool;
  }

  /** Execute the planning flow: create a plan and execute each step sequentially */
  async execute(userRequest: string): Promise<string> {
    // Create an initial plan by using the LLM to break down the task
    // Use the agent's LLM directly to generate plan steps (as a simple numbered list)
    const planningPrompt = `Break down the following task into a step-by-step plan:\n"${userRequest}"\nList the steps clearly.`;
    const planResponse = await this.agent["llm"].ask([{ role: "user", content: planningPrompt }]);
    // Parse the response into steps (assuming they are separated by line or number)
    const steps = planResponse.split("\n").filter(line => line.trim()).map(line => line.replace(/^\d+[\.\)]\s*/, "").trim());
    const planId = this.planningTool.createPlan(userRequest, steps);
    let lastResult = "";
    // Loop through each step in the plan and execute it with the agent
    for (const step of steps) {
      const currentIndex = steps.indexOf(step);
      console.log(`Executing plan step ${currentIndex}: ${step}`);
      // Run the Manus agent on the current step (this may internally use tools or produce an answer)
      try {
        lastResult = await this.agent.run(step);
      } catch (e: any) {
        lastResult = `Error executing step ${currentIndex}: ${e.message}`;
      }
      // Mark step as completed (with note as lastResult summary if needed)
      this.planningTool.markStepCompleted(planId, currentIndex, (lastResult && lastResult.length < 100) ? lastResult : undefined);
      // If agent terminated early, break out
      if (this.agent.state === AgentState.FINISHED) {
        break;
      }
    }
    return lastResult || "Plan execution completed.";
  }
}
