import type { EntryGenerator, PageServerLoad } from './$types';
import { Game } from '$lib/catalog/schema';
import { loadCatalog } from '$lib/server/catalog';

export const entries: EntryGenerator = () => Game.options.map((game) => ({ game }));

export const load = (({ params }) => {
	const game = Game.parse(params.game);
	return {
		game,
		catalog: loadCatalog(),
		builtAt: new Date().toISOString()
	};
}) satisfies PageServerLoad;
