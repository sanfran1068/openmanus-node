import { BaseAgent } from "./base";

/** ReActAgent: uses the Think-Act loop (ReAct pattern) */
export abstract class ReActAgent extends BaseAgent {
  /** Decide on next action (to be implemented by subclasses). Return true if an action (tool) is needed. */
  protected abstract think(): Promise<boolean>;
  /** Execute the decided action (to be implemented by subclasses). */
  protected abstract act(): Promise<string>;

  async step(): Promise<string> {
    // Perform one think-act cycle
    const shouldAct = await this.think();
    if (!shouldAct) {
      // No action needed, likely final answer produced
      return "Thinking complete - no action needed";
    }
    // If an action (tool call) is needed, perform it
    const result = await this.act();
    return result;
  }
}
