import { z } from 'zod';
import {
  ActionSchema,
  DataBindingSchema,
  DynamicStringSchema,
  FunctionCallSchema,
} from '@a2ui/web_core/v1_0';
import { DISCLAIMER_IDS } from '../compliance/disclaimers';
import { TONES, VALUE_FORMATS } from './format';

/**
 * Schemas of the catalog types that are ours (E1-S1). Column, Row, Card, Divider and Button
 * reuse A2UI's basic schemas. E1-S4 turns these into the single schema source for the agent
 * prompt and MCP tools.
 *
 * Conventions, which the A2UI resolver depends on:
 * - Bindable props use the `Dynamic*` schemas with a `REF:#/$defs/<Def>|<description>`
 *   description, as A2UI's own catalog does. A plain `DataBindingSchema` prop is NOT resolved.
 * - Every object is `.strict()`, so undeclared props are rejected.
 */
const ref = <T extends z.ZodTypeAny>(schema: T, def: string, description: string): T =>
  schema.describe(`REF:#/$defs/${def}|${description}`) as T;

const dynString = (d: string) => ref(DynamicStringSchema, 'DynamicString', d);
const action = (d: string) => ref(ActionSchema, 'Action', d);
/**
 * A value that must come from the data model. Literals are rejected, so specs never carry
 * balances, prices or transactions (rule 5).
 */
const bound = (d: string) => ref(z.union([DataBindingSchema, FunctionCallSchema]), 'DynamicValue', d);

const weight = z
  .number()
  .describe("Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.")
  .optional();
const format = z.enum(VALUE_FORMATS).describe('How to display the value.');
const currency = dynString('ISO 4217 currency code for `currency` values. Defaults to USD.').optional();

export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: dynString('The text to show. Plain text only: no markdown or HTML.'),
      variant: z
        .enum(['title', 'heading', 'body', 'caption'])
        .default('body')
        .describe("'title' for the page or view title, 'heading' for a section heading, 'caption' for small print.")
        .optional(),
      weight,
    })
    .strict(),
};

export const StatApi = {
  name: 'Stat',
  schema: z
    .object({
      label: dynString('What the figure is, such as "Total balance".'),
      value: bound('The figure, bound to a number in the data model.'),
      format: z.enum(['number', 'currency', 'percent']).default('number').describe('How to display value and change.').optional(),
      currency,
      change: bound('Optional change since the previous period, bound to a number, shown in the same format as value.').optional(),
      weight,
    })
    .strict(),
};

export const KeyValueListApi = {
  name: 'KeyValueList',
  schema: z
    .object({
      items: z
        .array(
          z
            .object({
              label: dynString('The label, such as "Fees".'),
              value: bound('The value, bound to the data model.'),
              format: format.default('text').optional(),
            })
            .strict(),
        )
        .min(1)
        .max(8)
        .describe('The labelled values, 1 to 8.'),
      currency,
      weight,
    })
    .strict(),
};

export const TableApi = {
  name: 'Table',
  schema: z
    .object({
      rows: bound('The rows: bind to a list of objects in the data model.'),
      columns: z
        .array(
          z
            .object({
              key: z.string().min(1).describe('Field of each row object to show in this column.'),
              header: z.string().min(1).describe('Column header.'),
              format: z
                .enum([...VALUE_FORMATS, 'status'])
                .default('text')
                .describe("How to display the cells. 'status' shows a coloured badge.")
                .optional(),
              align: z.enum(['start', 'end']).default('start').describe("Use 'end' for numbers.").optional(),
            })
            .strict(),
        )
        .min(1)
        .max(8)
        .describe('The columns, 1 to 8.'),
      currency,
      pageSize: z.number().int().min(5).max(50).default(10).describe('Rows per page.').optional(),
      rowKey: z.string().min(1).default('id').describe('Row field that identifies a row.').optional(),
      selection: dynString('Where to write the rowKey of the row the user picks. Bind it to a data-model path.').optional(),
      rowAction: action('Emitted when the user picks a row, after selection is written.').optional(),
      weight,
    })
    .strict(),
};

export const BadgeApi = {
  name: 'Badge',
  schema: z
    .object({
      text: dynString('The short label, such as an order status.'),
      tone: z.enum(TONES).default('neutral').describe('Colour meaning of the badge.').optional(),
      weight,
    })
    .strict(),
};

export const AlertApi = {
  name: 'Alert',
  schema: z
    .object({
      tone: z.enum(['info', 'warning', 'danger']).default('info').describe('How serious the message is.').optional(),
      title: dynString('Optional short title.').optional(),
      text: dynString('The message. Leave out when using disclaimerId.').optional(),
      disclaimerId: z
        .enum(DISCLAIMER_IDS)
        .describe('Show an approved disclaimer from the central store instead of text. Never write disclaimer text yourself.')
        .optional(),
      weight,
    })
    .strict(),
};

export const EmptyStateApi = {
  name: 'EmptyState',
  schema: z
    .object({
      title: dynString('What is empty, such as "No orders yet".'),
      text: dynString('One sentence on what the user can do.').optional(),
      actionLabel: dynString('Label of the one next-step button. Needs action.').optional(),
      action: action('The next step, emitted when the button is pressed.').optional(),
      weight,
    })
    .strict(),
};

export const SelectApi = {
  name: 'Select',
  schema: z
    .object({
      label: dynString('Field label.'),
      options: z
        .array(z.object({ value: z.string(), label: dynString('Option text.') }).strict())
        .min(1)
        .max(50)
        .describe('The choices, 1 to 50.'),
      value: dynString('The selected value. Bind it to a data-model path so the choice is written there.'),
      action: action('Optional, emitted after the value changes (for example to filter a list).').optional(),
      weight,
    })
    .strict(),
};

export const DateFieldApi = {
  name: 'DateField',
  schema: z
    .object({
      label: dynString('Field label.'),
      value: dynString('The date as YYYY-MM-DD. Bind it to a data-model path so the choice is written there.'),
      min: z.string().date().describe('Earliest allowed date, YYYY-MM-DD.').optional(),
      max: z.string().date().describe('Latest allowed date, YYYY-MM-DD.').optional(),
      action: action('Optional, emitted after the date changes.').optional(),
      weight,
    })
    .strict(),
};

/**
 * Locked: only pre-fill values, no children, no actions (rule 4, E4-S4). The agent can
 * open an order ticket but cannot change how it works or place anything.
 */
export const OrderTicketApi = {
  name: 'OrderTicket',
  schema: z
    .object({
      instrument: z.string().regex(/^[A-Z][A-Z0-9.]{0,9}$/).describe('Instrument symbol to pre-fill, such as "ALPN".').optional(),
      side: z.enum(['buy', 'sell']).describe('Side to pre-fill.').optional(),
      quantity: z.number().int().positive().max(1_000_000).describe('Quantity to pre-fill.').optional(),
      orderType: z.enum(['market', 'limit']).describe('Order type to pre-fill.').optional(),
      weight,
    })
    .strict(),
};

