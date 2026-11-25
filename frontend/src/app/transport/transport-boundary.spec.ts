import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * CLAUDE.md rule 3 (E3-S2): agent traffic goes only through AgentTransport. No source file
 * outside src/app/transport/ may use HttpClient, fetch, EventSource or postMessage.
 */
describe('E3-S2: transport boundary (rule 3)', () => {
  const root = join(process.cwd(), 'src');
  const transportDir = join(root, 'app', 'transport');
  const forbidden = /\bHttpClient\b|\bfetch\s*\(|\bEventSource\b|\bpostMessage\s*\(/;

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
    });
  }

  it('scans the app source', () => {
    expect(sourceFiles(root).length).toBeGreaterThan(40);
  });

  it('only src/app/transport/ uses HttpClient, fetch, EventSource or postMessage', () => {
    const offenders = sourceFiles(root)
      .filter((f) => !f.startsWith(transportDir))
      .filter((f) => forbidden.test(readFileSync(f, 'utf8')))
      .map((f) => relative(root, f));
    expect(offenders).toEqual([]);
  });
});
