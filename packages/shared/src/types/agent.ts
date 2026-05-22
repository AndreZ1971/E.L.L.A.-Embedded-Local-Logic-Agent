import type { ToolCall } from './tool.js';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCall?: ToolCall;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  toolCall?: ToolCall;
  sessionId: string;
}
