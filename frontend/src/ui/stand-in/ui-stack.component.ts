import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiStackDirection = 'vertical' | 'horizontal';
export type UiStackJustify = 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | 'stretch';
export type UiStackAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * Stand-in for the internal library's Grid, used for A2UI Column and Row. Material's grid
 * list needs fixed row heights, so the stand-in lays children out with flexbox instead.
 */
@Component({
  selector: 'ui-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-stack',
    '[class.ui-stack--horizontal]': "direction() === 'horizontal'",
    '[style.justify-content]': 'justifyCss()',
    '[style.align-items]': 'alignCss()',
  },
  template: `<ng-content />`,
})
export class UiStackComponent {
  readonly direction = input<UiStackDirection>('vertical');
  readonly justify = input<UiStackJustify>('start');
  readonly align = input<UiStackAlign>('stretch');

  protected readonly justifyCss = computed(() => JUSTIFY[this.justify()]);
  protected readonly alignCss = computed(() => ALIGN[this.align()]);
}

const JUSTIFY: Record<UiStackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
};
const ALIGN: Record<UiStackAlign, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
