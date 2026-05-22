import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[E.L.L.A. API Error]', err);
  res.status(500).json({ error: 'Internal server error' });
};
