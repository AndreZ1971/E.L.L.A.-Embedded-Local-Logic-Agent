import { EventEmitter } from "events";

export interface SystemEvent {
  id?: number;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();
export const EVENT_SYSTEM = "system";
