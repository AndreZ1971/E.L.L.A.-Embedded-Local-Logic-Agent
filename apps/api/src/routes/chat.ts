import { Router } from "express";
import { ollamaClient, type OllamaMessage } from "../services/ollama.js";
import { openaiClient } from "../services/openai.js";
import { toolExecutor } from "../tools/executor.js";
import { buildToolDefinitions } from "../tools/definitions.js";
import { sessionStore } from "../services/sessions.js";
import { env } from "../config/env.js";
import { getSettings } from "../services/settings.js";
import { recall, extractAndRemember } from "../services/memory.js";
import type { ToolName } from "@ella/shared";

function resolveProvider(): "openai" | "ollama" {
  const { provider } = getSettings();
  if (provider === "openai") return "openai";
  if (provider === "ollama") return "ollama";
  return openaiClient.isAvailable() ? "openai" : "ollama";
}

function activeToolDefs() {
  const { enabledTools, setups } = getSettings();
  return buildToolDefinitions(setups ?? []).filter(
    (t) =>
      enabledTools.includes(t.function.name) ||
      t.function.name === "load_setup",
  );
}

const DANGEROUS_TOOLS = new Map<string, string>([
  ["clean_temp", "Alle temporären Dateien löschen"],
  ["empty_recycle_bin", "Papierkorb unwiderruflich leeren"],
  ["mark_email", "E-Mails als gelesen/ungelesen markieren"],
  ["create_appointment", "Kalendertermin erstellen"],
]);

interface PendingConfirmation {
  tool: string;
  callId: string;
  args: Record<string, unknown>;
  messages: OllamaMessage[];
  sessionId: string;
  expireAt: number;
}

const pendingConfirmations = new Map<string, PendingConfirmation>();

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  try {
    const {
      message,
      sessionId = "default",
      model,
    } = req.body as {
      message?: string;
      sessionId?: string;
      model?: string;
    };

    if (!message) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const useOpenAI = resolveProvider() === "openai";
    const activeModel = model ?? getSettings().ollamaModel ?? env.ollamaModel;
    const tools = activeToolDefs();
    const history = await sessionStore.get(sessionId);
    history.push({ role: "user", content: message });

    const memories = await recall(message);
    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map((m) => ({ ...m, id: "", createdAt: "" })),
    );

    let finalReply = "";
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = useOpenAI
        ? await openaiClient.chat(messages, tools, memories)
        : await ollamaClient.chat(messages, tools, activeModel, memories);
      const assistantMsg = response.message;

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        finalReply = assistantMsg.content;
        break;
      }

      messages.push(assistantMsg);

      for (const call of assistantMsg.tool_calls) {
        const result = await toolExecutor.execute({
          tool: call.function.name as ToolName,
          args: call.function.arguments,
        });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalReply) finalReply = "Ich konnte keine Antwort generieren.";

    history.push({ role: "assistant", content: finalReply });
    await sessionStore.set(sessionId, history);
    extractAndRemember(message, finalReply, sessionId);

    res.json({ reply: finalReply, sessionId });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/stream", async (req, res) => {
  const {
    message,
    sessionId = "default",
    model,
  } = req.body as {
    message?: string;
    sessionId?: string;
    model?: string;
  };

  if (!message) {
    res.status(400).json({ error: "message required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const useOpenAI = resolveProvider() === "openai";
    const activeModel = model ?? getSettings().ollamaModel ?? env.ollamaModel;
    const tools = activeToolDefs();
    const history = await sessionStore.get(sessionId);
    history.push({ role: "user", content: message });

    const memories = await recall(message);
    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map((m) => ({ ...m, id: "", createdAt: "" })),
    );

    let finalReply = "";
    let pendingConfirmSent = false;
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = useOpenAI
        ? openaiClient.chatStream(messages, tools, memories)
        : ollamaClient.chatStream(messages, tools, activeModel, memories);

      let roundContent = "";
      let roundToolCalls: OllamaMessage["tool_calls"] | undefined;

      for await (const event of stream) {
        if (event.type === "chunk") {
          emit({ type: "chunk", text: event.text });
          roundContent += event.text;
        } else {
          roundToolCalls = event.toolCalls;
        }
      }

      if (!roundToolCalls || roundToolCalls.length === 0) {
        finalReply = roundContent;
        break;
      }

      // Check for dangerous tool before executing anything in this round
      const dangerousCall = roundToolCalls.find((c) =>
        DANGEROUS_TOOLS.has(c.function.name),
      );
      if (dangerousCall) {
        messages.push({
          role: "assistant",
          content: roundContent,
          tool_calls: roundToolCalls,
        });
        emit({
          type: "confirm",
          tool: dangerousCall.function.name,
          description: DANGEROUS_TOOLS.get(dangerousCall.function.name),
        });
        pendingConfirmations.set(sessionId, {
          tool: dangerousCall.function.name,
          callId: dangerousCall.id ?? "",
          args:
            (dangerousCall.function.arguments as Record<string, unknown>) ?? {},
          messages: [...messages],
          sessionId,
          expireAt: Date.now() + 5 * 60 * 1000,
        });
        pendingConfirmSent = true;
        break;
      }

      messages.push({
        role: "assistant",
        content: roundContent,
        tool_calls: roundToolCalls,
      });

      for (const call of roundToolCalls) {
        emit({ type: "tool", name: call.function.name });
        const result = await toolExecutor.execute({
          tool: call.function.name as ToolName,
          args: call.function.arguments,
        });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!pendingConfirmSent) {
      if (!finalReply) {
        finalReply = "Ich konnte keine Antwort generieren.";
        emit({ type: "chunk", text: finalReply });
      }
      emit({ type: "done" });
      history.push({ role: "assistant", content: finalReply });
      await sessionStore.set(sessionId, history);
      extractAndRemember(message, finalReply, sessionId);
    }
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unbekannter Fehler",
    });
  }

  res.end();
});

chatRouter.post("/confirm", async (req, res, next) => {
  try {
    const { sessionId = "default", confirmed } = req.body as {
      sessionId?: string;
      confirmed: boolean;
    };

    const pending = pendingConfirmations.get(sessionId);
    if (!pending || Date.now() > pending.expireAt) {
      pendingConfirmations.delete(sessionId);
      res.json({ reply: "Bestätigung abgelaufen oder nicht gefunden." });
      return;
    }
    pendingConfirmations.delete(sessionId);

    const history = await sessionStore.get(sessionId);

    if (!confirmed) {
      const reply = "Aktion abgebrochen.";
      history.push({ role: "assistant", content: reply });
      await sessionStore.set(sessionId, history);
      res.json({ reply });
      return;
    }

    const toolResult = await toolExecutor.execute({
      tool: pending.tool as ToolName,
      args: pending.args,
    });

    const msgs = [...pending.messages];
    msgs.push({
      role: "tool",
      tool_call_id: pending.callId,
      content: JSON.stringify(toolResult),
    });

    const useOpenAI = resolveProvider() === "openai";
    const activeModel = getSettings().ollamaModel ?? env.ollamaModel;
    const tools = activeToolDefs();
    let finalReply = "";
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = useOpenAI
        ? await openaiClient.chat(msgs, tools, [])
        : await ollamaClient.chat(msgs, tools, activeModel, []);
      const assistantMsg = response.message;

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        finalReply = assistantMsg.content;
        break;
      }

      msgs.push(assistantMsg);

      for (const call of assistantMsg.tool_calls) {
        const r = await toolExecutor.execute({
          tool: call.function.name as ToolName,
          args: call.function.arguments,
        });
        msgs.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(r),
        });
      }
    }

    if (!finalReply) finalReply = "Fertig.";

    history.push({ role: "assistant", content: finalReply });
    await sessionStore.set(sessionId, history);
    extractAndRemember("", finalReply, sessionId);

    res.json({ reply: finalReply });
  } catch (err) {
    next(err);
  }
});

chatRouter.get("/provider", (_req, res) => {
  const p = resolveProvider();
  const s = getSettings();
  res.json({
    provider: p,
    model: p === "openai" ? "gpt-4o" : (s.ollamaModel ?? env.ollamaModel),
  });
});

chatRouter.get("/history/:sessionId", async (req, res) => {
  const history = await sessionStore.get(req.params.sessionId);
  res.json({ messages: history, sessionId: req.params.sessionId });
});

chatRouter.delete("/history/:sessionId", async (req, res) => {
  await sessionStore.clear(req.params.sessionId);
  res.json({ ok: true });
});
