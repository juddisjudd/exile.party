import type { Catalog, Game, Tool } from './schema';

export interface CategoryCount {
	id: string;
	name: string;
	description?: string;
	count: number;
}

export function countByGame(tools: readonly Tool[]): Record<Game, number> {
	return {
		poe1: tools.filter((t) => t.games.includes('poe1')).length,
		poe2: tools.filter((t) => t.games.includes('poe2')).length
	};
}

/**
 * The first editor's pick in each category, in category order, capped.
 * Categories without a pick for this game are skipped, so a new player sees a spread of
 * categories rather than every pick in the directory.
 */
export function startHere(catalog: Catalog, game: Game, limit = 6): Tool[] {
	const picks: Tool[] = [];
	for (const category of catalog.categories) {
		if (picks.length === limit) break;
		const pick = catalog.tools.find(
			(t) => t.category === category.id && t.editorsPick && t.games.includes(game)
		);
		if (pick) picks.push(pick);
	}
	return picks;
}

export function categoryCounts(catalog: Catalog, game: Game): CategoryCount[] {
	return catalog.categories.map((c) => ({
		id: c.id,
		name: c.name,
		description: c.description,
		count: catalog.tools.filter((t) => t.category === c.id && t.games.includes(game)).length
	}));
}
