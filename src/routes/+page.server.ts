import type { PageServerLoad } from './$types';
import { countByGame } from '$lib/catalog/home';
import { loadCatalog } from '$lib/server/catalog';

export const load = (() => ({
	counts: countByGame(loadCatalog().tools)
})) satisfies PageServerLoad;
