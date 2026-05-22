import 'dotenv/config';
import express from 'express';
import { chatRouter } from './routes/chat.js';
import { toolsRouter } from './routes/tools.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.use(express.json());

app.use('/api/chat',  chatRouter);
app.use('/api/tools', toolsRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`E.L.L.A. API  →  http://localhost:${env.port}`);
});
