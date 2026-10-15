import { Provider } from '@angular/core';

/**
 * Icons are imported per component (tree-shakeable standalone Lucide components),
 * so no global registration is needed. Kept as an extension point.
 */
export const appIconsProvider: Provider[] = [];
