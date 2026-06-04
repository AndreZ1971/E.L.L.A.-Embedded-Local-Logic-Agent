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
      (enabledTools ?? []).includes(t.function.name) ||
      t.function.name === "load_setup",
  );
}

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
    const userName = getSettings().userName?.trim() ?? "";
    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map((m) => ({ ...m, id: "", createdAt: "" })),
    );

    let finalReply = "";
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = useOpenAI
        ? await openaiClient.chat(messages, tools, memories, userName)
        : await ollamaClient.chat(
            messages,
            tools,
            activeModel,
            memories,
            userName,
          );
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
    const userName = getSettings().userName?.trim() ?? "";
    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map((m) => ({ ...m, id: "", createdAt: "" })),
    );

    let finalReply = "";
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = useOpenAI
        ? openaiClient.chatStream(messages, tools, memories, userName)
        : ollamaClient.chatStream(
            messages,
            tools,
            activeModel,
            memories,
            userName,
          );

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
        if (result.directive) {
          emit({ type: "directive_deny", tool: call.function.name });
        }
        if (result.requiresConfirmation) {
          emit({
            type: "confirmation_required",
            message: result.confirmationMessage ?? "",
            pendingAction: result.pendingAction,
          });
          emit({ type: "done" });
          history.push({
            role: "assistant",
            content: result.confirmationMessage ?? "Bestätigung erforderlich.",
          });
          await sessionStore.set(sessionId, history);
          res.end();
          return;
        }
        if (
          call.function.name === "shutdown_system" &&
          result.success &&
          (result.output as Record<string, unknown>)?.exec_command
        ) {
          const out = result.output as Record<string, unknown>;
          emit({
            type: "shutdown",
            cmd: out.exec_command,
            delay: out.delay_seconds ?? 5,
          });
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalReply) {
      finalReply = "Ich konnte keine Antwort generieren.";
      emit({ type: "chunk", text: finalReply });
    }
    emit({ type: "done" });
    history.push({ role: "assistant", content: finalReply });
    await sessionStore.set(sessionId, history);
    extractAndRemember(message, finalReply, sessionId);
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unbekannter Fehler",
    });
  }

  res.end();
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
