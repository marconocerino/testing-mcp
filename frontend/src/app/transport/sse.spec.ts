import { readSse, SseEvent } from './sse';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const out: SseEvent[] = [];
  for await (const e of readSse(stream)) out.push(e);
  return out;
}

describe('E3-S3: server-sent event parser', () => {
  it('reads events with id, type and data', async () => {
    expect(await collect(streamOf('id: 1\nevent: a2ui\ndata: {"a":1}\n\n', 'event: done\ndata: {}\n\n'))).toEqual([
      { event: 'a2ui', id: '1', data: '{"a":1}' },
      { event: 'done', id: undefined, data: '{}' },
    ]);
  });

  it('joins events split across chunks, anywhere', async () => {
    expect(await collect(streamOf('id: 7\nev', 'ent: a2ui\nda', 'ta: {"b"', ':2}\n', '\n'))).toEqual([{ event: 'a2ui', id: '7', data: '{"b":2}' }]);
  });

  it('handles CRLF, multi-line data, comments and the default event type', async () => {
    expect(await collect(streamOf(': keep-alive\r\n\r\ndata: line 1\r\ndata: line 2\r\n\r\n'))).toEqual([{ event: 'message', id: undefined, data: 'line 1\nline 2' }]);
  });

  it('drops an event left incomplete when the stream ends', async () => {
    expect(await collect(streamOf('id: 1\nevent: a2ui\ndata: {"a":1}\n'))).toEqual([]);
  });
});
