import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
// Relative import on purpose: `bun run validate` runs this file outside Vite, where $lib does not resolve.
import { Catalog } from '../catalog/schema';

/** cwd is the repo root for `bun run build`, vitest, and the validate script. */
export const CATALOG_FILE = resolve(process.cwd(), 'tools.yaml');

/** Parse and validate YAML text. Split from file IO so tests can feed fixture strings. */
export function parseCatalog(text: string, source = 'tools.yaml'): Catalog {
	const r = Catalog.safeParse(parse(text));
	if (r.success) return r.data;
	throw new Error(`${source} failed validation:\n${z.prettifyError(r.error)}`);
}

/** Build-time only. Import from `*.server.ts` files and scripts. No memoisation: the file is small. */
export function loadCatalog(file = CATALOG_FILE): Catalog {
	return parseCatalog(readFileSync(file, 'utf8'), file);
}
