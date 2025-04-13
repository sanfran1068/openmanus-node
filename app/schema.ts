export enum AgentState {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
    ERROR = 'ERROR'
}

export interface Message {
    role: 'user' | 'system' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
    base64_image?: string;
}

export function systemMessage(content: string): Message {
    return { role: 'system', content };
}

export function userMessage(content: string): Message {
    return { role: 'user', content };
}

export function assistantMessage(content: string): Message {
    return { role: 'assistant', content };
}

export function toolMessage(content: string, tool_call_id?: string, name?: string, base64_image?: string): Message {
    return { role: 'tool', content, tool_call_id, name, base64_image };
} 