import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/** Formats a date in the interface language. */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(value: string | Date | null | undefined, style: 'long' | 'short' | 'month' = 'short'): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value.length === 10 ? value + 'T12:00:00' : value) : value;
    if (isNaN(date.getTime())) return '';
    const options: Intl.DateTimeFormatOptions =
      style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : style === 'month'
          ? { month: 'long', year: 'numeric' }
          : { day: 'numeric', month: 'short' };
    return new Intl.DateTimeFormat(this.i18n.intlLocale, options).format(date);
  }
}
