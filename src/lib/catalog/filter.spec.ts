import { describe, expect, it } from 'vitest';
import {
	EMPTY_FILTERS,
	activeChipCount,
	filterTools,
	fromSearchParams,
	isStale,
	toSearchParams
} from './filter';
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
	openSource: false,
	official: false,
	editorsPick: false,
	byMaintainer: false,
	status: 'active',
	lastVerified: '2026-01-01',
	...over
});

const tools = [
	tool({
		id: 'a',
		name: 'Awakened Trade',
		games: ['poe1'],
		category: 'trade',
		tags: ['overlay'],
		openSource: true
	}),
	tool({
		id: 'b',
		name: 'Builder',
		games: ['poe1', 'poe2'],
		category: 'build-planning',
		pricing: 'paid',
		openSource: true
	}),
	tool({
		id: 'c',
		name: 'Craft',
		description: 'Crafting sim.',
		games: ['poe2'],
		category: 'crafting',
		official: true
	})
];

const categories = ['trade', 'build-planning', 'crafting'];

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
	it('filters by pricing', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, pricing: 'paid' }).map((t) => t.id)).toEqual([
			'b'
		]);
	});
	it('filters open from closed source', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, code: 'open' }).map((t) => t.id)).toEqual([
			'a',
			'b'
		]);
		expect(filterTools(tools, { ...EMPTY_FILTERS, code: 'closed' }).map((t) => t.id)).toEqual([
			'c'
		]);
	});
	it('filters official from community', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, origin: 'official' }).map((t) => t.id)).toEqual([
			'c'
		]);
	});
	it('matches query against name and description, case-insensitive', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, query: 'CRAFT' }).map((t) => t.id)).toEqual([
			'c'
		]);
	});
	it('matches query against tags', () => {
		expect(filterTools(tools, { ...EMPTY_FILTERS, query: 'overlay' }).map((t) => t.id)).toEqual([
			'a'
		]);
	});
	it('combines dimensions', () => {
		expect(
			filterTools(tools, { ...EMPTY_FILTERS, game: 'poe1', pricing: 'paid' }).map((t) => t.id)
		).toEqual(['b']);
	});
});

describe('activeChipCount', () => {
	it('ignores game, which lives in the top bar', () => {
		expect(activeChipCount({ ...EMPTY_FILTERS, game: 'poe2' })).toBe(0);
	});
	it('counts each set chip once and ignores a blank query', () => {
		expect(
			activeChipCount({
				...EMPTY_FILTERS,
				category: 'trade',
				pricing: 'free',
				code: 'open',
				query: '   '
			})
		).toBe(3);
	});
});

describe('search params', () => {
	it('round-trips a full filter set', () => {
		const f = {
			game: 'poe2',
			category: 'crafting',
			pricing: 'freemium',
			origin: 'official',
			code: 'closed',
			query: 'sim'
		} as const;
		expect(fromSearchParams(toSearchParams(f), categories)).toEqual(f);
	});

	it('omits empty values', () => {
		expect(toSearchParams(EMPTY_FILTERS).toString()).toBe('');
	});

	it('drops values that are not valid options', () => {
		const p = new URLSearchParams('game=poe3&cat=nope&price=cheap&from=someone&code=maybe');
		expect(fromSearchParams(p, categories)).toEqual(EMPTY_FILTERS);
	});
});
