export const env = {
  port: Number(process.env.PORT ?? 3002),
  nodeEnv: process.env.NODE_ENV ?? "development",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME ?? "ella",
    user: process.env.DB_USER ?? "ella",
    password: process.env.DB_PASSWORD ?? "",
  },
} as const;
