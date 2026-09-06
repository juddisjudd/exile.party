import type { PageServerLoad } from './$types';
import { countByGame } from '$lib/catalog/home';
import { loadCatalog } from '$lib/server/catalog';

export const load = (() => {
	const catalog = loadCatalog();
	return {
		counts: countByGame(catalog.tools),
		total: catalog.tools.length
	};
}) satisfies PageServerLoad;
