import type { Game, Tool } from './schema';

export function countByGame(tools: readonly Tool[]): Record<Game, number> {
	return {
		poe1: tools.filter((t) => t.games.includes('poe1')).length,
		poe2: tools.filter((t) => t.games.includes('poe2')).length
	};
}
