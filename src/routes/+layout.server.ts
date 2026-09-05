import type { LayoutServerLoad } from './$types';
import { loadCatalog } from '$lib/server/catalog';

/** The submit dialog lists the valid category ids, so they come from the catalogue itself. */
export const load = (() => ({
	categoryIds: loadCatalog().categories.map((c) => c.id)
})) satisfies LayoutServerLoad;
