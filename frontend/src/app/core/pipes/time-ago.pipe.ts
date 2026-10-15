import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['week', 7 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 days ago", in the interface language. Dates older than a year show the date. */
@Pipe({ name: 'timeAgo', pure: false })
export class TimeAgoPipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    const locale = this.i18n.intlLocale;
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    if (Math.abs(seconds) > 365 * 86400) {
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return rtf.format(0, 'minute');
  }
}
