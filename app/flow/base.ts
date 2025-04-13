import { BaseAgent } from '../agent/base';

/** Abstract BaseFlow defining an execution flow for tasks */
export abstract class BaseFlow {
  protected agents: Map<string, BaseAgent>;
  protected tools?: any[];
  protected primaryAgentKey?: string;

  constructor(agents: BaseAgent | BaseAgent[] | Map<string, BaseAgent>, data: any = {}) {
    // Handle different ways of providing agents
    if (agents instanceof BaseAgent) {
      this.agents = new Map([['default', agents]]);
    } else if (Array.isArray(agents)) {
      this.agents = new Map(agents.map((agent, i) => [`agent_${i}`, agent]));
    } else {
      this.agents = agents;
    }

    // If primary agent not specified, use first agent
    if (!data.primaryAgentKey && this.agents.size > 0) {
      this.primaryAgentKey = this.agents.keys().next().value;
    } else {
      this.primaryAgentKey = data.primaryAgentKey;
    }

    // Set tools if provided
    if (data.tools) {
      this.tools = data.tools;
    }
  }

  get primaryAgent(): BaseAgent | undefined {
    return this.primaryAgentKey ? this.agents.get(this.primaryAgentKey) : undefined;
  }

  getAgent(key: string): BaseAgent | undefined {
    return this.agents.get(key);
  }

  addAgent(key: string, agent: BaseAgent): void {
    this.agents.set(key, agent);
  }

  abstract execute(inputText: string): Promise<string>;
}
