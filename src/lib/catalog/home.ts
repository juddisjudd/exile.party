import type { Category, Game, Tool } from './schema';

export function countByGame(tools: readonly Tool[]): Record<Game, number> {
	return {
		poe1: tools.filter((t) => t.games.includes('poe1')).length,
		poe2: tools.filter((t) => t.games.includes('poe2')).length
	};
}

export interface CategoryGroup extends Category {
	tools: Tool[];
}

/** Catalogue order, names A to Z inside each group, empty groups dropped. */
export function groupByCategory(
	categories: readonly Category[],
	tools: readonly Tool[]
): CategoryGroup[] {
	return categories
		.map((c) => ({
			...c,
			tools: tools.filter((t) => t.category === c.id).sort((a, b) => a.name.localeCompare(b.name))
		}))
		.filter((g) => g.tools.length > 0);
}

export const SECTION_PREVIEW = 6;

/** A long section shows its first `limit` tools and a "Browse all" for the rest. */
export function sectionPreview<T>(
	items: readonly T[],
	limit = SECTION_PREVIEW
): { shown: T[]; hidden: number } {
	if (items.length <= limit) return { shown: [...items], hidden: 0 };
	return { shown: items.slice(0, limit), hidden: items.length - limit };
}
