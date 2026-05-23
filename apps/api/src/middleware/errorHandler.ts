import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : String(err);
  const isOllamaDown = message.includes('ECONNREFUSED') && message.includes('11434');

  if (isOllamaDown) {
    console.warn('[E.L.L.A.] Ollama nicht erreichbar');
    res.status(503).json({ error: 'Ollama nicht erreichbar. Bitte starte Ollama.' });
    return;
  }

  console.error('[E.L.L.A. API Error]', err);
  res.status(500).json({ error: message });
};
