import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { appConfig } from '../app.config';
import { A2uiMessage, AgentTransport, ConnectionStatus, provideAgentTransport, surfaceIdOf } from './agent-transport';
import { MOCK_TRANSPORT_OPTIONS, MockTransport, pickRecording } from './mock-transport';
import { MOCK_RECORDINGS } from './recordings';

describe('E3-S2: AgentTransport and MockTransport', () => {
  let transport: MockTransport;
  let received: A2uiMessage[];

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideAgentTransport(MockTransport), { provide: MOCK_TRANSPORT_OPTIONS, useValue: { delayMs: 100 } }],
    });
    transport = TestBed.inject(AgentTransport) as MockTransport;
    received = [];
    transport.messages$.subscribe((m) => received.push(m));
  });

  afterEach(() => vi.useRealTimers());

  it('exposes the incoming stream, sendAction, sendPrompt and connection status', () => {
    expect(transport.messages$.subscribe).toBeTypeOf('function');
    expect(transport.sendAction).toBeTypeOf('function');
    expect(transport.sendPrompt).toBeTypeOf('function');
    expect(transport.status()).toBe('idle');
    expect(transport.error()).toBeNull();
  });

  it('replays the matching recording one message at a time, with status updates', () => {
    const recording = MOCK_RECORDINGS.find((r) => r.id === 'accounts-overview')!;
    transport.sendPrompt('Show my accounts');
    expect(transport.status()).toBe('connecting');
    expect(received).toEqual([]);

    vi.advanceTimersByTime(100);
    expect(received).toHaveLength(1);
    expect(transport.status()).toBe('streaming');

    vi.runAllTimers();
    expect(received).toEqual(recording.messages);
    expect(transport.status()).toBe('idle');
  });

  it('points the recording at the requested surface', () => {
    transport.sendPrompt('recent orders', { surfaceId: 'side' });
    vi.runAllTimers();
    expect(received.map(surfaceIdOf)).toEqual(received.map(() => 'side'));
  });

  it('picks the best keyword match, and the fallback when nothing matches', () => {
    expect(pickRecording(MOCK_RECORDINGS, 'Buy 10 shares of ALPN').id).toBe('prepare-order');
    expect(pickRecording(MOCK_RECORDINGS, 'show my recent ORDERS').id).toBe('recent-orders');
    expect(pickRecording(MOCK_RECORDINGS, 'What did I spend this month?').id).toBe('spending');
    expect(pickRecording(MOCK_RECORDINGS, 'tell me a joke').id).toBe('fallback');
  });

  it('a new prompt replaces the run in progress', () => {
    transport.sendPrompt('accounts');
    vi.advanceTimersByTime(100);
    transport.sendPrompt('spending');
    vi.runAllTimers();
    const spending = MOCK_RECORDINGS.find((r) => r.id === 'spending')!.messages;
    expect(received.slice(1)).toEqual(spending);
  });

  it('records actions and sends no messages for them', () => {
    const action = { name: 'showAccount', surfaceId: 'main', sourceComponentId: 'accT', context: { accountId: 'ACC-1' } };
    transport.sendAction(action);
    vi.runAllTimers();
    expect(transport.sentActions()).toEqual([action]);
    expect(received).toEqual([]);
  });
});

describe('E3-S2: swapping the transport', () => {
  @Injectable()
  class OtherTransport extends AgentTransport {
    override readonly messages$ = new Subject<A2uiMessage>();
    override readonly status = signal<ConnectionStatus>('idle');
    override readonly error = signal(null);
    override sendPrompt(): void {}
    override sendAction(): void {}
  }

  it('changing one provider line changes the implementation everywhere', () => {
    TestBed.configureTestingModule({ providers: [provideAgentTransport(OtherTransport)] });
    expect(TestBed.inject(AgentTransport)).toBeInstanceOf(OtherTransport);
  });

  it('the app config chooses the transport in exactly one provider', () => {
    const providers = (appConfig.providers as unknown[]).flat(Infinity) as { provide?: unknown }[];
    expect(providers.filter((p) => p?.provide === AgentTransport)).toHaveLength(1);
  });
});
