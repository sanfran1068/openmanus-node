import { AgentState } from "./base";
import { ReActAgent } from "./react";
import { ChatMessage, LLM } from "../llm";
import { ToolCollection, ToolError } from "../tool/base";
import logger from "../logger";

export class ToolCallAgent extends ReActAgent {
  protected pendingFunctionCall: { name: string; arguments: string } | null = null;
  protected toolChoice: string | { type: string; function?: { name: string } } = "auto";  // 更新类型定义
  protected lastToolCallId: string | null = null;

  constructor(options: any = {}) {
    super(options);
    // Ensure available_tools exists (could be passed in options)
    if (!this["available_tools"]) {
      this["available_tools"] = new ToolCollection();
    }
  }

  /** THINK: get LLM response with potential tool function call */
  protected async think(): Promise<boolean> {
    // Prepare system message(s) if any
    const systemMsgs: ChatMessage[] = [];
    if (this.system_prompt) {
      systemMsgs.push({ role: "system", content: this.system_prompt });
    }
    // If a specialized prompt to guide next step exists, it could be added as well (not used here explicitly)
    // Call LLM with current conversation and available tools
    const toolsParam = this.available_tools.toParams();

    try {
      const result = await this.llm.askTool({
        messages: this.messages,
        systemMsgs: systemMsgs,
        tools: toolsParam,
        toolChoice: this.toolChoice
      });

      if (result.functionCall) {
        // Model chose to call a tool
        this.pendingFunctionCall = result.functionCall;
        // 生成一个唯一的工具调用ID
        const toolCallId = `call_${Date.now()}`;
        // Add the assistant message indicating the function call to the conversation history
        this.messages.push({
          role: "assistant",
          content: undefined,  // 将null改为undefined，符合类型定义
          tool_calls: [{
            id: toolCallId,
            type: "function",
            function: {
              name: result.functionCall.name,
              arguments: result.functionCall.arguments
            }
          }]
        });
        // 存储工具调用ID以便在act方法中使用
        this.lastToolCallId = toolCallId;

        // 记录思考过程和选择的工具
        const selectedTools = result.functionCall ? 1 : 0;
        logger.thinking(`${this.name}:think:${this.current_step} - ${this.name}'s thoughts: ${result.content || "No explicit thoughts provided"}`);
        logger.info(`${this.name}:think:${this.current_step} - ${this.name} selected ${selectedTools} tools to use`);
        if (selectedTools > 0) {
          logger.highlight(`${this.name}:think:${this.current_step} - Tools being prepared: ['${result.functionCall.name}']`);
        }

        return true;  // indicates we need to perform an action
      } else if (result.content !== undefined) {
        // Model provided a direct answer (no tool needed)
        const answer = result.content;
        // Add the assistant's answer to memory
        this.updateMemory("assistant", answer);
        this.finalOutput = answer;
        // Mark agent as finished since answer is given
        this.state = AgentState.FINISHED;

        // 记录思考过程
        logger.thinking(`${this.name}:think:${this.current_step} - ${this.name}'s thoughts: ${answer}`);
        logger.info(`${this.name}:think:${this.current_step} - ${this.name} selected 0 tools to use`);

        return false;
      }

      // 记录思考过程（默认情况）
      logger.thinking(`${this.name}:think:${this.current_step} - ${this.name}'s thoughts: No explicit thoughts or actions provided`);
      logger.info(`${this.name}:think:${this.current_step} - ${this.name} selected 0 tools to use`);

      return false;
    } catch (error) {
      logger.error(`${this.name}:think:${this.current_step} - Error during thinking: ${error}`);
      return false;
    }
  }

  /** ACT: execute the requested tool and return its result */
  protected async act(): Promise<string> {
    if (!this.pendingFunctionCall) {
      logger.warn(`${this.name}:act:${this.current_step} - No pending action to execute`);
      return "No pending action.";
    }

    const { name: toolName, arguments: argsJSON } = this.pendingFunctionCall;
    let toolResult: string;

    logger.tool(`${this.name}:execute_tool:${this.current_step} - Activating tool: '${toolName}'...`);

    try {
      const toolArgs = argsJSON ? JSON.parse(argsJSON) : {};
      toolResult = await this.available_tools.execute(toolName, toolArgs);

      // 记录工具执行结果
      logger.result(`${this.name}:act:${this.current_step} - Tool '${toolName}' completed its mission! Result: ${toolResult.substring(0, 100)}${toolResult.length > 100 ? '...' : ''}`);
    } catch (e: any) {
      // If JSON parse fails or tool execution throws unexpected error
      const errMsg = e instanceof ToolError ? e.message : e.toString();
      toolResult = `Error: ${errMsg}`;

      // 记录工具执行错误
      logger.error_detail(`${this.name}:act:${this.current_step} - Tool '${toolName}' failed: ${errMsg}`);
    }

    // Append the tool's result as a tool message in the conversation
    this.messages.push({
      role: "tool",
      tool_call_id: this.lastToolCallId || `call_${Date.now()}`, // 使用think方法中存储的工具调用ID
      content: toolResult
    });

    // If the tool was 'terminate', end the agent loop
    if (toolName === "terminate") {
      this.finalOutput = toolResult;
      this.state = AgentState.FINISHED;
      logger.success(`${this.name}:act:${this.current_step} - Agent terminated by 'terminate' tool`);
    }

    // After acting, clear the pending call
    this.pendingFunctionCall = null;
    return toolResult;
  }
}
