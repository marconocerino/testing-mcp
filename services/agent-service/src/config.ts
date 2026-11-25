import { resolve } from 'node:path';

/** Service configuration. Everything comes from environment variables (rule: no secrets in code). */
export interface Config {
  port: number;
  llm: { baseUrl: string; model: string; apiKey: string };
  /** Folder with the generated catalog artifacts (E1-S4): catalog.json and catalog.prompt.md. */
  catalogDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env['LLM_API_KEY'];
  if (!apiKey) throw new Error('LLM_API_KEY is not set. Put it in the environment (locally: services/agent-service/.env).');
  return {
    port: Number(env['PORT'] ?? 8090),
    llm: {
      baseUrl: env['LLM_BASE_URL'] ?? 'https://api.groq.com/openai/v1',
      model: env['LLM_MODEL'] ?? 'openai/gpt-oss-120b',
      apiKey,
    },
    catalogDir: resolve(env['CATALOG_DIR'] ?? '../../frontend/src/app/catalog/generated'),
  };
}
