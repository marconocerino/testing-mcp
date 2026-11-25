import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { A2UI_RENDERER_CONFIG, A2uiRendererService, SurfaceComponent } from '@a2ui/angular';
import { UiAlertComponent, UiBadgeComponent, UiCardComponent, UiStackComponent, UiTextComponent, UiTone } from '@app/ui';
import { a2uiConfig } from '../../catalog/catalog';
import { provideCatalogRenderer } from '../../catalog/catalog-renderer.service';
import { formatSpecError } from '../../catalog/spec-errors';
import { CatalogSample, SAMPLE_FILES, SampleKind, sampleMessages, sampleSurfaceId } from './samples';

export interface GalleryAction {
  name: string;
  context: Record<string, unknown>;
}

export interface RenderedSample {
  surfaceId: string;
  sample: CatalogSample;
  /** Readable validation error, when the catalog rejected the spec. */
  error?: string;
  json: string;
}

export interface GallerySection {
  component: string;
  samples: RenderedSample[];
}

/** Actions emitted by gallery surfaces, by surface id. Nothing leaves the page. */
class GalleryActionLog {
  readonly last = signal<Record<string, GalleryAction>>({});
  record(action: { surfaceId: string; name: string; context?: Record<string, unknown> }) {
    this.last.update((all) => ({ ...all, [action.surfaceId]: { name: action.name, context: action.context ?? {} } }));
  }
}

const KIND_TONE: Record<SampleKind, UiTone> = { default: 'neutral', edge: 'info', invalid: 'warning' };

/**
 * Dev-only catalog gallery (E1-S5), at `/dev/catalog`. Renders every sample spec from
 * `./samples/*.json` through the real catalog with strict validation, each on its own surface.
 * Rejected specs show the validation error instead of a render.
 *
 * The page has its own renderer, so gallery surfaces never mix with the app's, and actions are
 * only shown on the page, never sent anywhere.
 */
@Component({
  selector: 'app-catalog-gallery-page',
  imports: [SurfaceComponent, UiAlertComponent, UiBadgeComponent, UiCardComponent, UiStackComponent, UiTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    GalleryActionLog,
    {
      provide: A2UI_RENDERER_CONFIG,
      useFactory: () => {
        const log = inject(GalleryActionLog);
        return { ...a2uiConfig(), actionHandler: (a: Parameters<GalleryActionLog['record']>[0]) => log.record(a) };
      },
    },
    provideCatalogRenderer(),
  ],
  styleUrl: './catalog-gallery.page.scss',
  template: `
    <ui-stack>
      <ui-text variant="title">Catalog gallery</ui-text>
      <ui-text variant="caption">
        Dev only. Every v1 catalog type rendered from the sample specs in
        src/app/dev/catalog-gallery/samples/. Edit a JSON file and reload to see the change. Mock data only.
      </ui-text>

      @for (section of sections; track section.component) {
        <section class="gallery-section" [attr.data-component]="section.component">
          <ui-stack>
            <ui-text variant="heading">{{ section.component }}</ui-text>
            <div class="gallery-grid">
              @for (item of section.samples; track item.surfaceId) {
                <ui-card class="gallery-sample" [attr.data-sample]="item.surfaceId">
                  <ui-stack>
                    <div class="gallery-sample__head">
                      <ui-text variant="body">{{ item.sample.name }}</ui-text>
                      <ui-badge [tone]="kindTone[item.sample.kind]">{{ item.sample.kind }}</ui-badge>
                    </div>
                    @if (item.sample.note) {
                      <ui-text variant="caption">{{ item.sample.note }}</ui-text>
                    }

                    @if (item.error) {
                      <ui-alert tone="danger" title="Validation error">
                        <span class="gallery-error">{{ item.error }}</span>
                      </ui-alert>
                    } @else {
                      <div class="gallery-render">
                        <a2ui-v09-surface [surfaceId]="item.surfaceId" />
                      </div>
                    }

                    @if (actions()[item.surfaceId]; as action) {
                      <ui-text variant="caption">
                        <span class="gallery-action">Action: {{ action.name }} {{ stringify(action.context) }}</span>
                      </ui-text>
                    }

                    <details>
                      <summary class="ui-type-small">Spec</summary>
                      <pre class="gallery-json">{{ item.json }}</pre>
                    </details>
                  </ui-stack>
                </ui-card>
              }
            </div>
          </ui-stack>
        </section>
      }
    </ui-stack>
  `,
})
export class CatalogGalleryPage {
  protected readonly kindTone = KIND_TONE;
  protected readonly actions = inject(GalleryActionLog).last;
  readonly sections: GallerySection[];

  constructor() {
    const renderer = inject(A2uiRendererService);
    this.sections = SAMPLE_FILES.map((file) => ({
      component: file.component,
      samples: file.samples.map((sample, i) => {
        const surfaceId = sampleSurfaceId(file.component, i);
        const json = JSON.stringify({ components: sample.components, data: sample.data ?? {} }, null, 2);
        try {
          renderer.processMessages(sampleMessages(surfaceId, sample));
          return { surfaceId, sample, json };
        } catch (e) {
          return { surfaceId, sample, json, error: formatSpecError(e) };
        }
      }),
    }));
  }

  protected stringify(value: unknown) {
    return JSON.stringify(value);
  }
}
