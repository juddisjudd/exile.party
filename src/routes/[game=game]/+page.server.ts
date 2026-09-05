import type { EntryGenerator, PageServerLoad } from './$types';
import { categoryCounts, startHere } from '$lib/catalog/home';
import { Game } from '$lib/catalog/schema';
import { loadCatalog } from '$lib/server/catalog';

export const entries: EntryGenerator = () => Game.options.map((game) => ({ game }));

export const load = (({ params }) => {
	const game = Game.parse(params.game);
	const catalog = loadCatalog();
	return {
		game,
		total: catalog.tools.filter((t) => t.games.includes(game)).length,
		startHere: startHere(catalog, game),
		categories: categoryCounts(catalog, game),
		builtAt: new Date().toISOString()
	};
}) satisfies PageServerLoad;
