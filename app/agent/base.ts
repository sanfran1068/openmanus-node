import { LLM, ChatMessage } from "../llm";
import { ToolCollection } from "../tool/base";
import logger from "../logger";

/** Agent state enumeration */
export enum AgentState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  FINISHED = "FINISHED"
}

/** BaseAgent defines common behavior for all agents */
export abstract class BaseAgent {
  name: string;
  description: string;
  state: AgentState;
  messages: ChatMessage[];
  protected llm: LLM;
  protected available_tools: ToolCollection;
  protected system_prompt?: string;
  protected next_step_prompt?: string;
  protected current_step: number;
  protected max_steps: number;
  protected finalOutput?: string;
  protected pendingFunctionCall: any;
  protected lastToolCallId: string | null;

  constructor(options: {
    name?: string;
    description?: string;
    system_prompt?: string;
    next_step_prompt?: string;
    max_steps?: number;
    tools?: ToolCollection;
  } = {}) {
    const { name, description, system_prompt, next_step_prompt, max_steps, tools } = options;
    this.name = name || "Agent";
    this.description = description || "";
    this.system_prompt = system_prompt;
    this.next_step_prompt = next_step_prompt;
    this.state = AgentState.IDLE;
    this.messages = [];
    this.current_step = 0;
    this.max_steps = max_steps ?? 20;
    this.finalOutput = undefined;
    this.available_tools = tools || new ToolCollection();  // can be set by subclass
    this.llm = LLM.getInstance();  // default LLM instance
    this.pendingFunctionCall = null;
    this.lastToolCallId = null;
  }

  // duplicate_threshold 缺失，缺少了stuck情况的处理

  /** Add a message to the agent's memory (conversation history) */
  updateMemory(role: ChatMessage["role"], content: string, name?: string) {
    const msg: ChatMessage = { role, content };
    if (name) msg.name = name;
    this.messages.push(msg);
  }

  /** Context manager for agent state (not as necessary in JS, handled in run()) */

  /** Abstract method: perform one step of the agent's workflow */
  abstract step(): Promise<string>;

  /** Run the agent's main loop until finished or max_steps reached */
  async run(request?: string): Promise<string> {
    // if (this.system_prompt) {
    //   this.updateMemory("system", this.system_prompt);
    // }
    if (request) {
      this.updateMemory("user", request);
    }
    try {
      this.state = AgentState.RUNNING;
      while (this.current_step < this.max_steps && this.state === AgentState.RUNNING) {
        this.current_step++;
        logger.step(`${this.name}:run:${this.current_step} - Executing step ${this.current_step}/${this.max_steps}`);
        await this.step();
      }
      if (this.current_step >= this.max_steps && this.state === AgentState.RUNNING) {
        this.state = AgentState.FINISHED;
        this.finalOutput = `Terminated: Reached max steps (${this.max_steps})`;
        logger.warn(`${this.name}:run - Reached max steps (${this.max_steps})`);
      }
    } catch (error) {
      logger.error_detail(`${this.name}:run - Error during execution: ${error}`);
      this.state = AgentState.FINISHED;
      this.finalOutput = `Error: ${error}`;
    } finally {
      if (this.state === AgentState.FINISHED) {
        logger.success(`${this.name}:run - Agent finished execution`);
        // remain FINISHED or allow external check; we won't reuse agent once finished for now
      }
    }
    if (this.finalOutput) {
      return this.finalOutput;
    }
    const lastMsg = [...this.messages].reverse().find(m => m.role === "assistant" && m.content);
    return lastMsg?.content ?? "";
  }
}
