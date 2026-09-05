import type { Game, Pricing, Tool } from './schema';

export const STALE_AFTER_DAYS = 180;

export type Origin = 'official' | 'community';
export type Code = 'open' | 'closed';

export interface Filters {
	game: Game | null;
	category: string | null;
	pricing: Pricing | null;
	origin: Origin | null;
	code: Code | null;
	query: string;
}

export const EMPTY_FILTERS: Filters = {
	game: null,
	category: null,
	pricing: null,
	origin: null,
	code: null,
	query: ''
};

/** `now` is the build timestamp (ISO string) so prerendered HTML matches hydration. */
export function isStale(lastVerified: string, now: string, days = STALE_AFTER_DAYS): boolean {
	return Date.parse(now) - Date.parse(lastVerified) > days * 864e5;
}

function matchesQuery(t: Tool, q: string): boolean {
	return (
		t.name.toLowerCase().includes(q) ||
		t.description.toLowerCase().includes(q) ||
		t.tags.some((tag) => tag.includes(q))
	);
}

export function filterTools(tools: readonly Tool[], f: Filters): Tool[] {
	const q = f.query.trim().toLowerCase();
	return tools.filter(
		(t) =>
			(f.game === null || t.games.includes(f.game)) &&
			(f.category === null || t.category === f.category) &&
			(f.pricing === null || t.pricing === f.pricing) &&
			(f.origin === null || (f.origin === 'official') === t.official) &&
			(f.code === null || (f.code === 'open') === t.openSource) &&
			(q === '' || matchesQuery(t, q))
	);
}

/** Game lives in the top bar and is always set, so it does not count as a chip. */
export function activeChipCount(f: Filters): number {
	return (
		(f.category === null ? 0 : 1) +
		(f.pricing === null ? 0 : 1) +
		(f.origin === null ? 0 : 1) +
		(f.code === null ? 0 : 1) +
		(f.query.trim() === '' ? 0 : 1)
	);
}

const KEYS = {
	game: 'game',
	category: 'cat',
	pricing: 'price',
	origin: 'from',
	code: 'code',
	query: 'q'
} as const;

/** Filters round-trip through the querystring so a filtered view is shareable. */
export function toSearchParams(f: Filters): URLSearchParams {
	const p = new URLSearchParams();
	if (f.game) p.set(KEYS.game, f.game);
	if (f.category) p.set(KEYS.category, f.category);
	if (f.pricing) p.set(KEYS.pricing, f.pricing);
	if (f.origin) p.set(KEYS.origin, f.origin);
	if (f.code) p.set(KEYS.code, f.code);
	if (f.query.trim()) p.set(KEYS.query, f.query.trim());
	return p;
}

function pick<T extends string>(v: string | null, allowed: readonly T[]): T | null {
	return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function fromSearchParams(p: URLSearchParams, categories: readonly string[]): Filters {
	return {
		game: pick(p.get(KEYS.game), ['poe1', 'poe2'] as const),
		category: pick(p.get(KEYS.category), categories),
		pricing: pick(p.get(KEYS.pricing), ['free', 'freemium', 'paid'] as const),
		origin: pick(p.get(KEYS.origin), ['official', 'community'] as const),
		code: pick(p.get(KEYS.code), ['open', 'closed'] as const),
		query: p.get(KEYS.query) ?? ''
	};
}
