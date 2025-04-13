import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

/** Chat message structure for LLM interactions */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function" | "tool";
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

/** Singleton LLM class to interface with OpenAI API */
export class LLM {
  private static _instances: { [key: string]: LLM } = {};
  private openai: OpenAI;
  private model: string;
  private constructor(apiKey: string, baseURL?: string, model?: string) {
    this.model = model || process.env.OPENAI_MODEL || "gpt-4";
    // Initialize OpenAI API client
    this.openai = new OpenAI({
      apiKey,
      baseURL: baseURL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    });
  }
  /** Get or create a singleton LLM instance (by config name) */
  public static getInstance(configName: string = "default"): LLM {
    if (!LLM._instances[configName]) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY in environment.");
      // (In a real scenario, could load different configs by name)
      LLM._instances[configName] = new LLM(apiKey);
    }
    return LLM._instances[configName];
  }

  /** Format messages for OpenAI if needed (accepts our ChatMessage format) */
  private formatMessages(messages: ChatMessage[]): any[] {
    // OpenAI library expects messages as {role, content[, name]} objects.
    return messages.map(msg => {
      const { role, content, name, tool_calls, tool_call_id } = msg;

      if (role === "assistant" && tool_calls) {
        // Assistant messages with tool_calls: send with tool_calls property
        const formattedMsg: any = { role, tool_calls };
        // 确保每个消息都有 content 字段，即使它是空字符串
        formattedMsg.content = content ?? "";
        return formattedMsg;
      }
      if (role === "function") {
        // Function result message: include name and content
        return { role, name: name, content: content ?? "" };
      }
      if (role === "tool") {
        // Tool result message: include tool_call_id and content
        return { role, tool_call_id, content: content ?? "" };
      }
      // system or user or assistant (normal) messages
      return { role, content: content ?? "" };
    });
  }

  /** Send a prompt to the LLM and get a completion (no tool/function calling) */
  public async ask(messages: ChatMessage[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: this.formatMessages(messages)
    });
    const msg = response.choices[0].message;
    return msg.content ?? "";
  }

  /** Send a prompt to LLM with available tools (function calling mode) */
  public async askTool(params: {
    messages: ChatMessage[];
    systemMsgs?: ChatMessage[];
    tools: any[];
    toolChoice?: string | { type: string; function?: { name: string } };
  }): Promise<{
    content?: string;
    functionCall?: { name: string; arguments: string };
  }> {
    const { messages, systemMsgs = [], tools, toolChoice = "auto" } = params;
    const allMessages = systemMsgs.length ? [...systemMsgs, ...messages] : messages;

    // 处理toolChoice参数
    let formattedToolChoice: any;
    if (toolChoice === "auto" || toolChoice === "none") {
      formattedToolChoice = toolChoice;
    } else if (typeof toolChoice === "string") {
      // 如果是字符串但不是"auto"或"none"，则假定它是工具名称
      formattedToolChoice = { type: "function", function: { name: toolChoice } };
    } else {
      // 已经是正确格式的对象
      formattedToolChoice = toolChoice;
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: this.formatMessages(allMessages),
      tools: tools,
      tool_choice: formattedToolChoice
    });

    const choice = response.choices[0];
    const msg = choice.message;
    // 仅在开发环境下打印调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Tool call:', msg.tool_calls?.[0]);
    }
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // The assistant wants to call a tool/function
      return {
        functionCall: {
          name: msg.tool_calls[0].function.name,
          arguments: msg.tool_calls[0].function.arguments
        }
      };
    } else {
      // The assistant provided a direct answer
      return { content: msg.content ?? "" };
    }
  }
}
