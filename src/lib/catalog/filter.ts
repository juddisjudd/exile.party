import type { Game, Tool } from './schema';

export const STALE_AFTER_DAYS = 180;

export interface Filters {
	game: Game | null;
	category: string | null;
	query: string;
}

export const EMPTY_FILTERS: Filters = { game: null, category: null, query: '' };

/** `now` is the build timestamp (ISO string) so prerendered HTML matches hydration. */
export function isStale(lastVerified: string, now: string, days = STALE_AFTER_DAYS): boolean {
	return Date.parse(now) - Date.parse(lastVerified) > days * 864e5;
}

export function filterTools(tools: readonly Tool[], f: Filters): Tool[] {
	const q = f.query.trim().toLowerCase();
	return tools.filter(
		(t) =>
			(f.game === null || t.games.includes(f.game)) &&
			(f.category === null || t.category === f.category) &&
			(q === '' || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
	);
}
