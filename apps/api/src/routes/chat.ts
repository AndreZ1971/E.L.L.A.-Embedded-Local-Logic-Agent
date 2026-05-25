import { Router } from "express";
import { ollamaClient, type OllamaMessage } from "../services/ollama.js";
import { openaiClient } from "../services/openai.js";
import { toolExecutor } from "../tools/executor.js";
import { TOOL_DEFINITIONS } from "../tools/definitions.js";
import { sessionStore } from "../services/sessions.js";
import { env } from "../config/env.js";
import type { ToolName } from "@ella/shared";

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

    const useOpenAI = openaiClient.isAvailable();
    const activeModel = model ?? env.ollamaModel;
    const history = await sessionStore.get(sessionId);
    history.push({ role: "user", content: message });

    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map((m) => ({ ...m, id: "", createdAt: "" })),
    );

    // Tool-Loop: LLM kann mehrere Tools hintereinander aufrufen
    let finalReply = "";
    const MAX_ROUNDS = 5;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = useOpenAI
        ? await openaiClient.chat(messages, TOOL_DEFINITIONS)
        : await ollamaClient.chat(messages, TOOL_DEFINITIONS, activeModel);
      const assistantMsg = response.message;

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        finalReply = assistantMsg.content;
        break;
      }

      // Tool-Calls ausführen
      messages.push(assistantMsg);

      for (const call of assistantMsg.tool_calls) {
        const toolName = call.function.name as ToolName;
        const result = await toolExecutor.execute({
          tool: toolName,
          args: call.function.arguments,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalReply) {
      finalReply = "Ich konnte keine Antwort generieren.";
    }

    history.push({ role: "assistant", content: finalReply });
    await sessionStore.set(sessionId, history);

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

  const useOpenAI = openaiClient.isAvailable();
  const activeModel = model ?? env.ollamaModel;
  const history = await sessionStore.get(sessionId);
  history.push({ role: "user", content: message });

  const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
    history.map((m) => ({ ...m, id: "", createdAt: "" })),
  );

  let finalReply = "";
  const MAX_ROUNDS = 5;

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = useOpenAI
        ? openaiClient.chatStream(messages, TOOL_DEFINITIONS)
        : ollamaClient.chatStream(messages, TOOL_DEFINITIONS, activeModel);

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
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unbekannter Fehler",
    });
  }

  res.end();
});

// Provider-Status
chatRouter.get("/provider", (_req, res) => {
  res.json({
    provider: openaiClient.isAvailable() ? "openai" : "ollama",
    model: openaiClient.isAvailable() ? "gpt-4o" : env.ollamaModel,
  });
});

// Verlauf abrufen
chatRouter.get("/history/:sessionId", async (req, res) => {
  const history = await sessionStore.get(req.params.sessionId);
  res.json({ messages: history, sessionId: req.params.sessionId });
});

// Verlauf löschen
chatRouter.delete("/history/:sessionId", async (req, res) => {
  await sessionStore.clear(req.params.sessionId);
  res.json({ ok: true });
});
