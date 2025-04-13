import { BaseTool, ToolError } from "./base";
import { LLM } from "../llm";

/** Tool to get a direct completion from the LLM (useful for structured output requests) */
export class CreateChatCompletion extends BaseTool {
  constructor() {
    super(
      "create_chat_completion",
      "Use the LLM to generate a completion given a prompt and optional system instructions.",
      {
        type: "object",
        properties: {
          prompt: { type: "string", description: "(required) The user prompt for the chat completion." },
          system_prompt: { type: "string", description: "(optional) A system-level instruction for the completion." }
        },
        required: ["prompt"]
      }
    );
  }
  async execute(args: { prompt: string; system_prompt?: string }): Promise<string> {
    const { prompt, system_prompt } = args;
    if (!prompt) throw new ToolError("Prompt is required for chat completion");
    const llm = LLM.getInstance();
    const messages = [];
    if (system_prompt) {
      messages.push({ role: "system" as const, content: system_prompt });
    }
    messages.push({ role: "user" as const, content: prompt });
    try {
      const result = await llm.ask(messages);
      return result;
    } catch (e: any) {
      throw new ToolError("LLM completion failed: " + e.message);
    }
  }
}
