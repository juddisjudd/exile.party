import type { PageServerLoad } from './$types';
import { loadCatalog } from '$lib/server/catalog';

export const load = (() => ({
	catalog: loadCatalog(),
	builtAt: new Date().toISOString()
})) satisfies PageServerLoad;
