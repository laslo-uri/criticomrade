// Fills `gtmId` / `gaId` in environment.prod.ts from the GTM_ID / GA_ID build env vars (Vercel).
// Without them the fields stay empty and the app ships no analytics, no banner and no footer link.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../src/environments/environment.prod.ts', import.meta.url));
const ids = {
  gtmId: [process.env.GTM_ID, /^GTM-[A-Z0-9]+$/],
  gaId: [process.env.GA_ID, /^G-[A-Z0-9]+$/],
};

let source = readFileSync(file, 'utf8');
for (const [field, [raw, pattern]] of Object.entries(ids)) {
  const value = (raw ?? '').trim();
  if (value && !pattern.test(value)) {
    console.warn(`[analytics-env] ${field}: "${value}" does not look like a valid ID, ignoring it.`);
  }
  const safe = pattern.test(value) ? value : '';
  const line = new RegExp(`(\\b${field}:\\s*)'[^']*'`);
  if (!line.test(source)) throw new Error(`[analytics-env] ${field} field not found in ${file}`);
  source = source.replace(line, `$1'${safe}'`);
  console.log(`[analytics-env] ${field} ${safe ? 'set' : 'empty'}`);
}
writeFileSync(file, source);
