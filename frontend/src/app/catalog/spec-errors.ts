/**
 * Makes a renderer error about a spec easy to read, for people (gallery, logs) and for the
 * model's repair step (E5). A schema failure ("Validation failed for component 'X' (id):
 * issue; issue") becomes the header plus one line per distinct issue; zod repeats an issue
 * once per union branch, so duplicates are dropped. Other errors are returned as they are.
 */
export function formatSpecError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  const match = /^(Validation failed[^:]*):\s*([\s\S]*)$/.exec(message);
  if (!match) return message;
  const issues = [...new Set(match[2].split('; ').map((i) => i.trim()).filter(Boolean))];
  return [match[1], ...issues].join('\n');
}
