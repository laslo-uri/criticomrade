import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from '@angular/animations';

const enterEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
const leaveEase = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Auth ↔ app shell (login, register, main layout) */
export const rootRouteAnimations = trigger('rootRouteAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '100dvh',
        }),
      ],
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [
          animate(
            `240ms ${leaveEase}`,
            style({ opacity: 0, transform: 'scale(0.985) translateY(-6px)' })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateY(18px) scale(0.99)' }),
          animate(
            `420ms ${enterEase}`,
            style({ opacity: 1, transform: 'translateY(0) scale(1)' })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);

/** In-app page changes (home, explore, settings, …) */
export const shellRouteAnimations = trigger('shellRouteAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [
          animate(
            `200ms ${leaveEase}`,
            style({ opacity: 0, transform: 'translateY(-8px)' })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateY(14px)' }),
          animate(
            `340ms ${enterEase}`,
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
