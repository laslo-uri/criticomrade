import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-password-field',
  imports: [LucideEye, LucideEyeOff],
  template: `
    <div class="relative">
      <input
        [type]="visible() ? 'text' : 'password'"
        class="input-field pr-12"
        [id]="inputId()"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [name]="name()"
        [autocomplete]="autocomplete()"
        [required]="required()"
        [attr.minlength]="minlength()"
        [disabled]="disabled"
      />
      <button
        type="button"
        class="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:text-text"
        (click)="visible.set(!visible())"
        [attr.aria-label]="i18n.translate(visible() ? 'common.passwordHide' : 'common.passwordShow')"
        [attr.aria-pressed]="visible()"
      >
        @if (visible()) { <svg lucideEyeOff [size]="18" /> } @else { <svg lucideEye [size]="18" /> }
      </button>
    </div>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordFieldComponent), multi: true }],
})
export class PasswordFieldComponent implements ControlValueAccessor {
  readonly i18n = inject(TranslationService);

  readonly name = input('');
  readonly inputId = input<string | null>(null);
  readonly autocomplete = input('current-password');
  readonly required = input(false);
  readonly minlength = input<number | null>(null);

  readonly visible = signal(false);
  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
