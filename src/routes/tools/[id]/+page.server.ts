import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { loadCatalog } from '$lib/server/catalog';

export const entries: EntryGenerator = () => loadCatalog().tools.map((t) => ({ id: t.id }));

export const load = (({ params }) => {
	const catalog = loadCatalog();
	const tool = catalog.tools.find((t) => t.id === params.id);
	if (!tool) error(404, 'No such tool');
	const category = catalog.categories.find((c) => c.id === tool.category)!;
	return { tool, category, builtAt: new Date().toISOString() };
}) satisfies PageServerLoad;
