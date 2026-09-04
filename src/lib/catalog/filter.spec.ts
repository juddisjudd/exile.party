import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, filterTools, isStale } from './filter';
import type { Tool } from './schema';

const tool = (over: Partial<Tool>): Tool => ({
	id: 'x',
	name: 'X',
	description: 'A tool that does things.',
	url: 'https://x.example',
	games: ['poe1'],
	category: 'trade',
	tags: [],
	platforms: ['web'],
	pricing: 'free',
	status: 'active',
	lastVerified: '2026-01-01',
	...over
});

const tools = [
	tool({ id: 'a', name: 'Awakened Trade', games: ['poe1'], category: 'trade' }),
	tool({ id: 'b', name: 'Builder', games: ['poe1', 'poe2'], category: 'build-planning' }),
	tool({
		id: 'c',
		name: 'Craft',
		description: 'Crafting sim.',
		games: ['poe2'],
		category: 'crafting'
	})
];

describe('isStale', () => {
	it('is stale after the threshold', () => {
		expect(isStale('2026-01-01', '2026-09-04T00:00:00Z')).toBe(true);
	});
	it('is fresh within the threshold', () => {
		expect(isStale('2026-08-01', '2026-09-04T00:00:00Z')).toBe(false);
	});
});

describe('filterTools', () => {
	it('returns everything with empty filters', () => {
		expect(filterTools(tools, EMPTY_FILTERS)).toHaveLength(3);
	});
	it('filters by game', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, game: 'poe2' }).map((t) => t.id)).toEqual([
			'b',
			'c'
		]);
	});
	it('filters by category', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, category: 'trade' }).map((t) => t.id)).toEqual([
			'a'
		]);
	});
	it('matches query against name and description, case-insensitive', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, query: 'CRAFT' }).map((t) => t.id)).toEqual([
			'c'
		]);
	});
});
