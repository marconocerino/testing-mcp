import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A person's initials in a circle. The internal library has no avatar, so the stand-in composes
 * one. `name` is announced to screen readers; the initials are decorative.
 */
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-avatar', role: 'img', '[attr.aria-label]': 'name()' },
  template: `<span aria-hidden="true">{{ initials() }}</span>`,
})
export class UiAvatarComponent {
  readonly name = input.required<string>();
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join(''),
  );
}
