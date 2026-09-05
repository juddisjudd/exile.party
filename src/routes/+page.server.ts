import type { PageServerLoad } from './$types';
import { loadCatalog } from '$lib/server/catalog';

export const load = (() => {
	const catalog = loadCatalog();
	return {
		total: catalog.tools.length,
		categories: catalog.categories.map((c) => ({
			id: c.id,
			name: c.name,
			description: c.description,
			count: catalog.tools.filter((t) => t.category === c.id).length
		}))
	};
}) satisfies PageServerLoad;
