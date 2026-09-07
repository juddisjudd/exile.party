import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadCatalog } from '../src/lib/server/catalog';

const STATIC = resolve(process.cwd(), 'static');

try {
	const c = loadCatalog();

	// The schema only checks file names; a typo would pass CI and 404 on the tool page.
	const missing = c.tools
		.flatMap((t) => [
			...(t.icon ? [`icons/${t.icon}`] : []),
			...t.screenshots.map((s) => `shots/${t.id}/${s}`)
		])
		.filter((f) => !existsSync(resolve(STATIC, f)));
	if (missing.length > 0) {
		throw new Error(`tools.yaml points at files missing from static/:\n  ${missing.join('\n  ')}`);
	}

	const assets =
		c.tools.filter((t) => t.icon).length + c.tools.reduce((n, t) => n + t.screenshots.length, 0);
	console.log(
		`tools.yaml OK: ${c.categories.length} categories, ${c.tools.length} tools, ${assets} asset files present`
	);
} catch (e) {
	console.error(e instanceof Error ? e.message : e);
	process.exit(1);
}
