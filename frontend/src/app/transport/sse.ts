/** One server-sent event. */
export interface SseEvent {
  /** `event:` field; `message` when the server sends none. */
  event: string;
  /** `id:` field, if any. */
  id?: string;
  /** `data:` lines joined with newlines. */
  data: string;
}

/**
 * Reads a `text/event-stream` body (per the HTML spec's event stream format) and yields events
 * as they complete. Handles events split across chunks, CRLF line endings, multi-line data and
 * comment lines.
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let id: string | undefined;
  let data: string[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.search(/\r\n|\r|\n/)) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + (buffer.startsWith('\r\n', newline) ? 2 : 1));
        if (line === '') {
          if (data.length) yield { event: event || 'message', id, data: data.join('\n') };
          event = '';
          id = undefined;
          data = [];
          continue;
        }
        if (line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'data') data.push(value);
        else if (field === 'event') event = value;
        else if (field === 'id') id = value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
