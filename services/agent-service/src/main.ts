import { loadCatalog } from './catalog.js';
import { loadConfig } from './config.js';
import { openAiCompatibleModel, withBusyDetection } from './llm.js';
import { buildSystemPrompt, PROMPT_VERSION } from './prompt.js';
import { createServer } from './server.js';
import { createValidator } from './validate.js';

const config = loadConfig();
const catalog = loadCatalog(config.catalogDir);
const log = (event: string, data: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), event, promptVersion: PROMPT_VERSION, ...data }));

const app = createServer(
  {
    model: withBusyDetection(openAiCompatibleModel(config.llm)),
    validate: createValidator(catalog),
    systemPrompt: buildSystemPrompt(catalog),
    catalogId: catalog.catalogId,
  },
  log,
);

app.listen(config.port, () => {
  log('service.started', { port: config.port, model: config.llm.model, catalog: `${catalog.catalogId}@${catalog.schemaVersion}` });
});
