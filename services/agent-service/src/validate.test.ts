import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { catalog, VALID_VIEW } from './test-support.js';
import { createValidator } from './validate.js';

const validate = createValidator(catalog);
const withRoot = (...rest: object[]) => [{ id: 'root', component: 'Column', children: rest.map((c) => (c as { id: string }).id) }, ...rest];

describe('E5-S3: server-side validation against the catalog', () => {
  it('accepts a valid view', () => {
    assert.deepEqual(validate(VALID_VIEW.components), { ok: true, errors: [] });
  });

  it('rejects unknown component types', () => {
    const r = validate(withRoot({ id: 'f', component: 'Iframe', src: 'x' }));
    assert.equal(r.ok, false);
    assert.match(r.errors.join('\n'), /Unknown component type 'Iframe'/);
  });

  it('rejects unknown props and bad enum values, naming them', () => {
    const r = validate(withRoot({ id: 'b', component: 'Badge', text: 'x', tone: 'purple', onClick: 'y' }));
    assert.match(r.errors.join('\n'), /unknown prop 'onClick'/);
    assert.match(r.errors.join('\n'), /must be one of/);
  });

  it('rejects literal figures (rule 5)', () => {
    const r = validate(withRoot({ id: 's', component: 'Stat', label: 'Cash', value: 16306.35 }));
    assert.equal(r.ok, false);
    assert.match(r.errors.join('\n'), /'Stat' \(s\)/);
  });

  it('checks structure: one root, existing children, nothing orphaned, no duplicate ids', () => {
    assert.match(validate([{ id: 'a', component: 'Text', text: 'x' }]).errors.join('\n'), /No component has the id 'root'/);
    assert.match(validate([{ id: 'root', component: 'Card', child: 'missing' }]).errors.join('\n'), /refers to 'missing'/);
    assert.match(validate([{ id: 'root', component: 'Text', text: 'x' }, { id: 'lost', component: 'Text', text: 'y' }]).errors.join('\n'), /'lost' is not inside/);
    assert.match(validate([{ id: 'root', component: 'Text', text: 'x' }, { id: 'root', component: 'Text', text: 'y' }]).errors.join('\n'), /Duplicate id 'root'/);
  });

  it('allows only allow-listed actions, so no view can ask to place an order (rule 4)', () => {
    const button = (name: string) => withRoot({ id: 'b', component: 'Button', child: 'l', action: { event: { name } } }, { id: 'l', component: 'Text', text: 'Go' });
    // The label is a child of the button, not of root.
    const fix = (cs: { id: string; children?: string[] }[]) => (cs[0]!.children = ['b'], cs);
    assert.equal(validate(fix(button('openOrderTicket') as never)).ok, true);
    const r = validate(fix(button('placeOrder') as never));
    assert.equal(r.ok, false);
    assert.match(r.errors.join('\n'), /action 'placeOrder', which is not allowed/);
  });

  it('checks formats too: a DateField min must be a date', () => {
    const date = (min: string) => withRoot({ id: 'd', component: 'DateField', label: 'From', value: { path: '/ui/from' }, min });
    assert.equal(validate(date('2026-11-01')).ok, true);
    assert.equal(validate(date('yesterday')).ok, false);
  });

  it('rejects an empty or missing list', () => {
    assert.equal(validate([]).ok, false);
    assert.equal(validate(undefined).ok, false);
  });
});
