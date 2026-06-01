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

        class="input-field pr-11"

        [value]="value"

        (input)="onInput($event)"

        [name]="name()"

        [autocomplete]="autocomplete()"

        [required]="required()"

        [disabled]="disabled"

      />

      <button

        type="button"

        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"

        (click)="toggleVisibility()"

        [attr.aria-label]="passwordAriaLabel()"

        [attr.aria-pressed]="visible()"

      >

        @if (visible()) {

          <svg lucideEyeOff [size]="18" />

        } @else {

          <svg lucideEye [size]="18" />

        }

      </button>

    </div>

  `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PasswordFieldComponent),
            multi: true,
        },
    ]
})

export class PasswordFieldComponent implements ControlValueAccessor {

  private readonly i18n = inject(TranslationService);



  readonly name = input('');

  readonly autocomplete = input('current-password');

  readonly required = input(false);



  readonly visible = signal(false);

  value = '';

  disabled = false;



  private onChange: (value: string) => void = () => {};

  private onTouched: () => void = () => {};



  passwordAriaLabel(): string {

    return this.visible()

      ? this.i18n.translate('common.passwordHide')

      : this.i18n.translate('common.passwordShow');

  }



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

    const next = (event.target as HTMLInputElement).value;

    this.value = next;

    this.onChange(next);

    this.onTouched();

  }



  toggleVisibility(): void {

    this.visible.update((v) => !v);

  }

}

