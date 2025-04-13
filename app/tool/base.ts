import { ChatMessage } from "../llm";

// Tool result types for consistency
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}
export interface ToolResult {
  output?: string;
  error?: string;
}

/** Abstract BaseTool that all tools extend */
export abstract class BaseTool {
  name: string;
  description: string;
  parameters: object;  // JSON schema for parameters
  constructor(name: string, description: string, parameters: object) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
  }
  /** Execute the tool with given arguments (to be implemented by subclasses) */
  abstract execute(args: any): Promise<string>;

  /** Convert tool to OpenAI API function spec (with strict schema enforcement) */
  toParam(): object {
    // Ensure no extra params allowed and strict mode on
    const paramsSchema = { ...this.parameters, additionalProperties: false };
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: paramsSchema,
      }
    };
  }
}

/** Collection of tools for an agent */
export class ToolCollection {
  tools: BaseTool[];
  toolMap: { [name: string]: BaseTool };

  constructor(...tools: BaseTool[]) {
    this.tools = tools;
    this.toolMap = {};
    for (const tool of tools) {
      this.toolMap[tool.name] = tool;
    }
  }

  [Symbol.iterator]() {
    return this.tools[Symbol.iterator]();
  }

  toParams(): object[] {
    return this.tools.map(t => t.toParam());
  }

  /** Execute a tool by name with given input arguments */
  async execute(name: string, toolInput: any): Promise<string> {
    const tool = this.toolMap[name];
    if (!tool) {
      // Unknown tool
      throw new ToolError(`Tool '${name}' is invalid`);
    }
    try {
      const result = await tool.execute(toolInput);
      return result;
    } catch (e: any) {
      if (e instanceof ToolError) {
        // Known tool error
        return `Error: ${e.message}`;
      } else {
        // Unexpected error
        throw e;
      }
    }
  }
}
