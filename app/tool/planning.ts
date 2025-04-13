import { BaseTool, ToolError } from "./base";

/** In-memory representation of a plan */
interface Plan {
  id: string;
  title: string;
  steps: { index: number; description: string; status: "pending" | "completed"; note?: string }[];
  currentStep: number;
}

/** Tool to create and manage task plans (for multi-step task planning) */
export class PlanningTool extends BaseTool {
  private plans: Map<string, Plan> = new Map();
  private activePlanId: string | null = null;
  private planCounter: number = 0;

  constructor() {
    super(
      "planning",
      "Create and manage task plans (list of steps) for the agent to follow.",
      {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "(required) Action to perform: 'create', 'get', 'list', 'set_active', 'mark_step', or 'delete'.",
            enum: ["create", "get", "list", "set_active", "mark_step", "delete"]
          },
          title: { type: "string", description: "(for create) Title or goal of the plan." },
          plan_id: { type: "string", description: "(for get/set_active/delete/mark_step) ID of the target plan." },
          step_index: { type: "integer", description: "(for mark_step) Index of the step to mark as completed." },
          note: { type: "string", description: "(optional) Note or result to attach when marking a step completed." }
        },
        required: ["command"]
      }
    );
  }

  /** Helper to generate a new unique plan ID */
  private generatePlanId(): string {
    this.planCounter += 1;
    return `plan_${this.planCounter}`;
  }

  /** Create a new plan with given title and optional steps, return the plan ID */
  public createPlan(title: string, stepsList?: string[]): string {
    const id = this.generatePlanId();
    const steps = stepsList ? stepsList.map((desc, idx) => ({ index: idx, description: desc, status: "pending" as const })) : [];
    const plan: Plan = { id, title, steps, currentStep: 0 };
    this.plans.set(id, plan);
    this.activePlanId = id;
    return id;
  }

  /** Retrieve the current step (first pending step) of a plan */
  public getCurrentStep(planId: string): { index: number; description: string } | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    const step = plan.steps.find(s => s.status === "pending");
    return step ? { index: step.index, description: step.description } : null;
  }

  /** Mark a step as completed (with optional note) */
  public markStepCompleted(planId: string, stepIndex: number, note?: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;
    const step = plan.steps.find(s => s.index === stepIndex);
    if (!step) return false;
    step.status = "completed";
    if (note) step.note = note;
    // advance currentStep pointer
    plan.currentStep = stepIndex + 1;
    this.plans.set(planId, plan);
    return true;
  }

  async execute(args: { command: string; title?: string; plan_id?: string; step_index?: number; note?: string }): Promise<string> {
    const { command, title, plan_id, step_index, note } = args;
    switch (command) {
      case "create":
        if (!title) throw new ToolError("title is required to create a plan");
        const newId = this.createPlan(title);
        return `Created plan '${newId}' for "${title}" with ${this.plans.get(newId)!.steps.length} steps.`;
      case "list":
        if (this.plans.size === 0) return "No plans available.";
        return [...this.plans.values()].map(p => `${p.id}: ${p.title} (${p.steps.length} steps)`).join("\n");
      case "get":
        if (!plan_id) throw new ToolError("plan_id is required to get a plan");
        if (!this.plans.has(plan_id)) throw new ToolError(`Plan '${plan_id}' not found`);
        const plan = this.plans.get(plan_id)!;
        const stepsInfo = plan.steps.map(s => `Step ${s.index}: ${s.description} [${s.status}]${s.note ? " - " + s.note : ""}`).join("\n");
        return `Plan "${plan.title}" (${plan.id}):\n` + stepsInfo;
      case "set_active":
        if (!plan_id) throw new ToolError("plan_id is required to set active plan");
        if (!this.plans.has(plan_id)) throw new ToolError(`Plan '${plan_id}' not found`);
        this.activePlanId = plan_id;
        return `Plan '${plan_id}' is now active.`;
      case "mark_step":
        if (!plan_id || step_index === undefined) throw new ToolError("plan_id and step_index are required to mark a step");
        if (!this.plans.has(plan_id)) throw new ToolError(`Plan '${plan_id}' not found`);
        const success = this.markStepCompleted(plan_id, step_index, note);
        if (!success) throw new ToolError(`Failed to mark step ${step_index} as completed`);
        return `Marked step ${step_index} as completed for plan '${plan_id}'.`;
      case "delete":
        if (!plan_id) throw new ToolError("plan_id is required to delete a plan");
        if (this.plans.delete(plan_id)) {
          if (this.activePlanId === plan_id) this.activePlanId = null;
          return `Plan '${plan_id}' deleted.`;
        } else {
          throw new ToolError(`Plan '${plan_id}' not found`);
        }
      default:
        throw new ToolError("Unknown command");
    }
  }
}
