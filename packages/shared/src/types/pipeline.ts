export type PipelineExecutionMode = "sequential" | "parallel";

export interface PipelineAgentDef {
  id: string;
  name: string;
  role: string;
  tools: string[];
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  executionMode: PipelineExecutionMode;
  agents: PipelineAgentDef[];
}

export type AgentStatus = "pending" | "running" | "done" | "error";

export interface AgentResult {
  agentId: string;
  agentName: string;
  content: string;
  toolsUsed: string[];
  status: AgentStatus;
  error?: string;
}

// SSE-Events die der Pipeline-Route sendet
export type PipelineEvent =
  | { type: "agent_start"; agentId: string; agentName: string }
  | { type: "agent_chunk"; agentId: string; text: string }
  | { type: "agent_tool"; agentId: string; toolName: string }
  | {
      type: "agent_done";
      agentId: string;
      content: string;
      toolsUsed: string[];
    }
  | { type: "pipeline_done"; results: AgentResult[]; summary: string }
  | {
      type: "setup_executed";
      setupName: string;
      success: boolean;
      message: string;
    }
  | { type: "error"; message: string };
