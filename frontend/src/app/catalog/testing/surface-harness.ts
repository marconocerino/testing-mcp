import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { A2uiRendererService, provideA2Ui, SurfaceComponent } from '@a2ui/angular';
import { a2uiConfig, CATALOG_ID } from '../catalog';
import { provideCatalogRenderer } from '../catalog-renderer.service';

export const TEST_SURFACE = 'adapter-test';

@Component({ imports: [SurfaceComponent], template: `<a2ui-v09-surface surfaceId="${TEST_SURFACE}" />` })
class SurfaceHost {}

export interface DispatchedAction {
  name: string;
  sourceComponentId: string;
  context: Record<string, unknown>;
}

/**
 * Renders A2UI components through the real catalog and renderer, with strict validation, and
 * records every action the surface emits. Call {@link createSurfaceHarness} in `beforeEach`.
 */
export interface SurfaceHarness {
  readonly actions: DispatchedAction[];
  /** Processes the components (first one is the root) and the data, then renders. Throws on invalid specs. */
  render(components: object[], data?: Record<string, unknown>): Promise<HTMLElement>;
  /** Validates components without rendering. Throws on invalid specs. */
  process(components: object[]): void;
  updateData(path: string, value: unknown): Promise<void>;
  readData(path: string): unknown;
  stable(): Promise<void>;
  readonly fixture: ComponentFixture<SurfaceHost>;
}

export function createSurfaceHarness(): SurfaceHarness {
  const actions: DispatchedAction[] = [];
  TestBed.configureTestingModule({
    imports: [SurfaceHost],
    providers: [
      provideA2Ui({ ...a2uiConfig(), actionHandler: (a) => void actions.push(a as DispatchedAction) }),
      provideCatalogRenderer(),
    ],
  });
  const renderer = TestBed.inject(A2uiRendererService);
  let fixture: ComponentFixture<SurfaceHost> | undefined;
  let created = false;

  const setData = (path: string, value: unknown) => ({ version: 'v0.9', updateDataModel: { surfaceId: TEST_SURFACE, path, value } });
  const ensureSurface = () => {
    if (created) return [];
    created = true;
    return [{ version: 'v0.9', createSurface: { surfaceId: TEST_SURFACE, catalogId: CATALOG_ID } }];
  };

  return {
    actions,
    get fixture() {
      if (!fixture) throw new Error('render() first');
      return fixture;
    },
    process(components) {
      renderer.processMessages([...ensureSurface(), { version: 'v0.9', updateComponents: { surfaceId: TEST_SURFACE, components } }] as never);
    },
    async render(components, data = {}) {
      renderer.processMessages([
        ...ensureSurface(),
        { version: 'v0.9', updateComponents: { surfaceId: TEST_SURFACE, components } },
        ...Object.entries(data).map(([path, value]) => setData(path, value)),
      ] as never);
      fixture = TestBed.createComponent(SurfaceHost);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    },
    async updateData(path, value) {
      renderer.processMessages([setData(path, value)] as never);
      await fixture?.whenStable();
    },
    readData(path) {
      return renderer.surfaceGroup.getSurface(TEST_SURFACE)?.dataModel.get(path);
    },
    async stable() {
      await fixture?.whenStable();
    },
  };
}

/** A Text component, the usual child of Card, Button, Column and Row. */
export const text = (id: string, value: unknown, variant?: string) => ({ id, component: 'Text', text: value, ...(variant ? { variant } : {}) });
