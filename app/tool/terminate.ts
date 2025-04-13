import { BaseTool } from "./base";

/** Tool to signal termination of the agent's process */
export class Terminate extends BaseTool {
  constructor() {
    super(
      "terminate",
      "Terminate the agent's interaction and stop the workflow.",
      {
        type: "object",
        properties: {
          reason: { type: "string", description: "(optional) Reason for termination or any final message." }
        },
        required: []
      }
    );
  }
  async execute(args: { reason?: string }): Promise<string> {
    return args.reason ? `Terminating: ${args.reason}` : "Terminating agent as requested.";
  }
}
