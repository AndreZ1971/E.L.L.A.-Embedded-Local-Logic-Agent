import { Router } from 'express';
import { ollamaClient, type OllamaMessage } from '../services/ollama.js';
import { openaiClient } from '../services/openai.js';
import { toolExecutor } from '../tools/executor.js';
import { TOOL_DEFINITIONS } from '../tools/definitions.js';
import { sessionStore } from '../services/sessions.js';
import { env } from '../config/env.js';
import type { ToolName } from '@ella/shared';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message, sessionId = 'default', model } = req.body as {
      message?: string;
      sessionId?: string;
      model?: string;
    };

    if (!message) {
      res.status(400).json({ error: 'message required' });
      return;
    }

    const useOpenAI = openaiClient.isAvailable();
    const activeModel = model ?? env.ollamaModel;
    const history = sessionStore.get(sessionId);
    history.push({ role: 'user', content: message });

    const messages: OllamaMessage[] = ollamaClient.toOllamaMessages(
      history.map(m => ({ ...m, id: '', createdAt: '' })),
    );

    // Tool-Loop: LLM kann mehrere Tools hintereinander aufrufen
    let finalReply = '';
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
          role: 'tool',
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalReply) {
      finalReply = 'Ich konnte keine Antwort generieren.';
    }

    history.push({ role: 'assistant', content: finalReply });
    sessionStore.set(sessionId, history);

    res.json({ reply: finalReply, sessionId });
  } catch (err) {
    next(err);
  }
});

// Provider-Status
chatRouter.get('/provider', (_req, res) => {
  res.json({
    provider: openaiClient.isAvailable() ? 'openai' : 'ollama',
    model:    openaiClient.isAvailable() ? 'gpt-4o' : env.ollamaModel,
  });
});

// Verlauf abrufen
chatRouter.get('/history/:sessionId', (req, res) => {
  const history = sessionStore.get(req.params.sessionId);
  res.json({ messages: history, sessionId: req.params.sessionId });
});

// Verlauf löschen
chatRouter.delete('/history/:sessionId', (req, res) => {
  sessionStore.clear(req.params.sessionId);
  res.json({ ok: true });
});
