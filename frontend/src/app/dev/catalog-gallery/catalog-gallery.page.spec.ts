import { TestBed } from '@angular/core/testing';
import { provideA2Ui } from '@a2ui/angular';
import { CATALOG_V1_TYPES } from '../../catalog/catalog-v1';
import { a2uiConfig } from '../../catalog/catalog';
import { CatalogGalleryPage, readableError } from './catalog-gallery.page';
import { SAMPLE_FILES } from './samples';

describe('E1-S5: catalog gallery page', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CatalogGalleryPage], providers: [provideA2Ui(a2uiConfig())] });
  });

  async function renderPage() {
    const fixture = TestBed.createComponent(CatalogGalleryPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, page: fixture.componentInstance };
  }

  it('every v1 component has a sample file with at least two samples, and nothing else does', () => {
    const files = SAMPLE_FILES.map((f) => f.component);
    expect([...files].sort()).toEqual([...CATALOG_V1_TYPES].sort());
    for (const file of SAMPLE_FILES) {
      expect(file.samples.length, file.component).toBeGreaterThanOrEqual(2);
    }
  });

  it('each component has a default, an edge case and an invalid sample, and each sample uses its component', () => {
    for (const file of SAMPLE_FILES) {
      expect(new Set(file.samples.map((s) => s.kind)), file.component).toEqual(new Set(['default', 'edge', 'invalid']));
      for (const s of file.samples) {
        expect(s.components.some((c) => (c as { component: string }).component === file.component), `${file.component} / ${s.name}`).toBe(true);
      }
    }
  });

  it('shows a section per component, in catalog order', async () => {
    const { el } = await renderPage();
    const sections = [...el.querySelectorAll('section[data-component]')].map((s) => s.getAttribute('data-component'));
    expect(sections).toEqual([...CATALOG_V1_TYPES]);
  });

  it('default and edge samples render through the catalog; invalid samples show the validation error instead', async () => {
    const { el, page } = await renderPage();
    for (const section of page.sections) {
      for (const item of section.samples) {
        const card = el.querySelector(`[data-sample="${item.surfaceId}"]`)!;
        const label = `${section.component} / ${item.sample.name}`;
        if (item.sample.kind === 'invalid') {
          expect(item.error, label).toBeTruthy();
          expect(card.querySelector('a2ui-v09-surface'), label).toBeNull();
          expect(card.querySelector('.ui-alert[role="alert"]')?.textContent, label).toContain('Validation error');
        } else {
          expect(item.error, `${label}: ${item.error}`).toBeUndefined();
          expect(card.querySelector('a2ui-v09-surface')?.children.length, label).toBeGreaterThan(0);
          expect(card.querySelector('.gallery-error'), label).toBeNull();
        }
      }
    }
  });

  it('renders the sample data: the default Stat shows its bound balance', async () => {
    const { el } = await renderPage();
    const stat = el.querySelector('[data-sample="gallery-Stat-0"]')!;
    expect(stat.querySelector('.ui-stat__value')?.textContent).toBe('$48,210.55');
  });

  it('names the rejected prop in the error', async () => {
    const { el } = await renderPage();
    expect(el.querySelector('[data-sample="gallery-Stat-2"] .gallery-error')?.textContent).toMatch(/value/);
    expect(el.querySelector('[data-sample="gallery-Text-2"] .gallery-error')?.textContent).toMatch(/html|Unrecognized key/);
  });

  it('shows actions on the page, next to the sample that emitted them', async () => {
    const { el, fixture } = await renderPage();
    const sample = el.querySelector('[data-sample="gallery-EmptyState-0"]')!;
    sample.querySelector<HTMLButtonElement>('ui-empty-state button')!.click();
    await fixture.whenStable();
    expect(sample.querySelector('.gallery-action')?.textContent).toContain('openOrderTicket');
    expect(el.querySelectorAll('.gallery-action')).toHaveLength(1);
  });

  it('shows the spec of each sample', async () => {
    const { el } = await renderPage();
    expect(el.querySelector('[data-sample="gallery-Card-0"] .gallery-json')?.textContent).toContain('"component": "Card"');
  });
});

describe('E1-S5: readableError', () => {
  it('puts each distinct schema issue on its own line', () => {
    const err = new Error("Validation failed for component 'Stat' (root): value: Expected object, received number; value: Expected object, received number; label: Required");
    expect(readableError(err)).toBe("Validation failed for component 'Stat' (root)\nvalue: Expected object, received number\nlabel: Required");
  });

  it('keeps other messages as they are', () => {
    expect(readableError(new Error('Component "missing" not found'))).toBe('Component "missing" not found');
    expect(readableError('boom')).toBe('boom');
  });
});
