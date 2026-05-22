import { Router } from 'express';
import { toolRegistry } from '../tools/registry.js';
import { toolExecutor } from '../tools/executor.js';
import type { ToolCall } from '@ella/shared';

export const toolsRouter = Router();

toolsRouter.get('/', (_req, res) => {
  res.json({ tools: toolRegistry.listEnabled() });
});

toolsRouter.post('/execute', async (req, res, next) => {
  try {
    const call = req.body as ToolCall;
    if (!call?.tool) {
      res.status(400).json({ error: 'tool required' });
      return;
    }
    const result = await toolExecutor.execute(call);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
