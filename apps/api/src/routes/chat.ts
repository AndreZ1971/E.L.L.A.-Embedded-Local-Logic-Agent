import { Router } from "express";
import { ollamaClient, type OllamaMessage } from "../services/ollama.js";
import { openaiClient } from "../services/openai.js";
import { toolExecutor } from "../tools/executor.js";
import { buildToolDefinitions } from "../tools/definitions.js";
import { sessionStore } from "../services/sessions.js";
import { env } from "../config/env.js";
import { getSettings } from "../services/settings.js";
import { recall, extractAndRemember } from "../services/memory.js";
import { recordActivity } from "../services/worker.js";
import { getForegroundWindowTitle } from "../services/windowContext.js";
import { compressSession } from "../services/sessionCompressor.js";
import type { ToolName } from "@ella/shared";

// Per-session mutex: serializes concurrent requests for the same session
// prevents Read-Modify-Write races when two messages arrive simultaneously
const sessionQueue = new Map<string, Promise<void>>();

function withSessionLock<T>(
  sessionId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = sessionQueue.get(sessionId) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  sessionQueue.set(
    sessionId,
    next.then(
      () => {},
      () => {},
    ),
  );
  return next;
}

function resolveProvider(): "openai" | "ollama" {
  const { provider } = getSettings();
  if (provider === "openai") return "openai";
  if (provider === "ollama") return "ollama";
  return openaiClient.isAvailable() ? "openai" : "ollama";
}

function activeToolDefs() {
  const { enabledTools, setups, homeworkMode } = getSettings();
  return buildToolDefinitions(setups ?? []).filter((t) => {
    if (
      !(enabledTools ?? []).includes(t.function.name) &&
      t.function.name !== "load_setup"
    )
      return false;
    // PIN darf nie über den Chat eingegeben werden — nur über den Schloss-Button-Dialog
    if (homeworkMode.active && t.function.name === "deactivate_homework_mode")
      return false;
    return true;
  });
}

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  recordActivity();
  const {
    message,
    sessionId = "default",
    model,
    isVoice,
    stressLevel,
  } = req.body as {
    message?: string;
    sessionId?: string;
    model?: string;
    isVoice?: boolean;
    stressLevel?: "low" | "medium" | "high";
  };

  if (!message) {
    res.status(400).json({ error: "message required" });
    return;
  }

  withSessionLock(sessionId, async () => {
    const useOpenAI = resolveProvider() === "openai";
    const settings = getSettings();
    const activeModel =
      model ??
      (isVoice && settings.voiceOllamaModel
        ? settings.voiceOllamaModel
        : null) ??
      settings.ollamaModel ??
      env.ollamaModel;
    const tools = activeToolDefs();
    const history = await sessionStore.get(sessionId);

    // Kompression (Ollama-only, nie OpenAI — exfiltrate-Direktive)
    if (
      settings.sessionCompressionEnabled &&
      !useOpenAI &&
      history.length >= 15
    ) {
      const compressed = await compressSession(history);
      if (compressed.length < history.length) {
        await sessionStore.set(sessionId, compressed);
        history.splice(0, history.length, ...compressed);
      }
    }

    history.push({ role: "user", content: message });

    let memories = await recall(message);
    const userName = settings.userName?.trim() ?? "";

    // Fenster-Kontext (opt-in, kein OpenAI)
    if (settings.windowContextEnabled && !useOpenAI) {
      const winTitle = getForegroundWindowTitle();
      if (winTitle) memories = [`Aktives Fenster: ${winTitle}`, ...memories];
    }

    // Stress-Kontext (opt-in via stressDetectionEnabled)
    if (
      settings.stressDetectionEnabled &&
      stressLevel &&
      stressLevel !== "low"
    ) {
      const hint =
        stressLevel === "high"
          ? "[HINWEIS: Die Stimme des Nutzers klingt stark angespannt. Reagiere mitfühlend und ruhig.]"
          : "[HINWEIS: Die Stimme des Nutzers klingt leicht angespannt.]";
      memories = [hint, ...memories];
    }

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
  }).catch(next);
});

chatRouter.post("/stream", async (req, res) => {
  recordActivity();
  const {
    message,
    sessionId = "default",
    model,
    stressLevel,
  } = req.body as {
    message?: string;
    sessionId?: string;
    model?: string;
    stressLevel?: "low" | "medium" | "high";
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

  await withSessionLock(sessionId, async () => {
    try {
      const useOpenAI = resolveProvider() === "openai";
      const settings = getSettings();
      const activeModel = model ?? settings.ollamaModel ?? env.ollamaModel;
      const tools = activeToolDefs();
      const history = await sessionStore.get(sessionId);

      // Kompression (Ollama-only, nie OpenAI — exfiltrate-Direktive)
      if (
        settings.sessionCompressionEnabled &&
        !useOpenAI &&
        history.length >= 15
      ) {
        const compressed = await compressSession(history);
        if (compressed.length < history.length) {
          await sessionStore.set(sessionId, compressed);
          history.splice(0, history.length, ...compressed);
        }
      }

      history.push({ role: "user", content: message });

      let memories = await recall(message);
      const userName = settings.userName?.trim() ?? "";

      // Fenster-Kontext (opt-in, kein OpenAI)
      if (settings.windowContextEnabled && !useOpenAI) {
        const winTitle = getForegroundWindowTitle();
        if (winTitle) memories = [`Aktives Fenster: ${winTitle}`, ...memories];
      }

      // Stress-Kontext (opt-in via stressDetectionEnabled)
      if (
        settings.stressDetectionEnabled &&
        stressLevel &&
        stressLevel !== "low"
      ) {
        const hint =
          stressLevel === "high"
            ? "[HINWEIS: Die Stimme des Nutzers klingt stark angespannt. Reagiere mitfühlend und ruhig.]"
            : "[HINWEIS: Die Stimme des Nutzers klingt leicht angespannt.]";
        memories = [hint, ...memories];
      }

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
          if (
            (call.function.name === "activate_homework_mode" ||
              call.function.name === "deactivate_homework_mode") &&
            result.success
          ) {
            const hw = getSettings().homeworkMode;
            emit({
              type: "homework_status",
              active: hw.active,
              configured: !!hw.pinHash,
            });
          }
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
              content:
                result.confirmationMessage ?? "Bestätigung erforderlich.",
            });
            await sessionStore.set(sessionId, history);
            return; // lock releases → outer res.end() called
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
          if (
            call.function.name === "pause_ella" &&
            result.success &&
            (result.output as Record<string, unknown>)?.paused
          ) {
            const out = result.output as Record<string, unknown>;
            emit({ type: "pause", minutes: Number(out.minutes ?? 10) });
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
  });

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
