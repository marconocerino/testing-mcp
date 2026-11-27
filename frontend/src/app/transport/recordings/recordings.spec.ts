import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import { a2uiConfig, CATALOG_ID } from '../../catalog/catalog';
import { provideCatalogRenderer } from '../../catalog/catalog-renderer.service';
import { MOCK_RECORDINGS } from '.';

describe('E3-S2: recorded A2UI message files', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideA2Ui(a2uiConfig()), provideCatalogRenderer()] });
  });

  it('has a fallback recording', () => {
    expect(MOCK_RECORDINGS.some((r) => r.id === 'fallback')).toBe(true);
  });

  // Recordings are real A2UI streams: each message must be valid against the catalog as it
  // arrives, except the one recording that exists to demo the fallback card.
  for (const recording of MOCK_RECORDINGS) {
    it(`${recording.id} ${recording.id === 'invalid-spec' ? 'fails' : 'passes'} validation, message by message`, () => {
      const renderer = TestBed.inject(A2uiRendererService);
      const surfaceId = `rec-${recording.id}`;
      const run = () => {
        for (const m of recording.messages) {
          const copy = JSON.parse(JSON.stringify(m).replaceAll('"surfaceId":"main"', `"surfaceId":"${surfaceId}"`));
          renderer.processMessages([copy] as never);
        }
      };
      if (recording.id === 'invalid-spec') expect(run).toThrow(/Iframe/);
      else expect(run).not.toThrow();
    });
  }

  it('every recording starts by creating its surface with this catalog', () => {
    for (const r of MOCK_RECORDINGS) expect(r.messages[0].createSurface?.catalogId, r.id).toBe(CATALOG_ID);
  });

  it('recordings carry no data, only layout and bindings (rule 5)', () => {
    for (const r of MOCK_RECORDINGS) expect(r.messages.some((m) => m.updateDataModel), r.id).toBe(false);
  });
});
