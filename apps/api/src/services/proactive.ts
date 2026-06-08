import { eventBus, EVENT_SYSTEM } from "./eventBus.js";

export function sendProactiveMessage(
  message: string,
  type: "info" | "warning" | "suggestion" | "alarm" = "info",
): void {
  eventBus.emit(EVENT_SYSTEM, {
    type: "proactive_message",
    payload: { message, messageType: type },
    created_at: new Date().toISOString(),
  });
}
