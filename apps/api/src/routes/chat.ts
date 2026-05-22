import { Router } from 'express';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: 'message required' });
      return;
    }

    // TODO: forward to Ollama / OpenAI, parse tool-call JSON response
    res.json({ reply: `Echo: ${message}`, sessionId: 'default' });
  } catch (err) {
    next(err);
  }
});
