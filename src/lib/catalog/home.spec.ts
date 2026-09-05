import { describe, expect, it } from 'vitest';
import { categoryCounts, countByGame, startHere } from './home';
import type { Catalog, Tool } from './schema';

const tool = (over: Partial<Tool> & { id: string }): Tool => ({
	name: over.id,
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

const catalog: Catalog = {
	categories: [
		{ id: 'build', name: 'Build' },
		{ id: 'trade', name: 'Trade' },
		{ id: 'maps', name: 'Maps' },
		{ id: 'data', name: 'Data', description: 'Numbers.' }
	],
	tools: [
		tool({ id: 'pob', category: 'build', games: ['poe1', 'poe2'], editorsPick: true }),
		tool({ id: 'awakened', category: 'trade', games: ['poe1'], editorsPick: true }),
		tool({ id: 'exchange2', category: 'trade', games: ['poe2'], editorsPick: true }),
		tool({ id: 'sidekick', category: 'trade', games: ['poe1', 'poe2'] }),
		tool({ id: 'ninja', category: 'data', games: ['poe1', 'poe2'], editorsPick: true }),
		tool({ id: 'poe2db', category: 'data', games: ['poe2'], editorsPick: true })
	]
};

describe('countByGame', () => {
	it('counts a tool once per game it lists', () => {
		expect(countByGame(catalog.tools)).toEqual({ poe1: 4, poe2: 5 });
	});
});

describe('startHere', () => {
	it('takes the first editor pick of each category, in category order', () => {
		expect(startHere(catalog, 'poe2').map((t) => t.id)).toEqual(['pob', 'exchange2', 'ninja']);
	});

	it('ignores picks for the other game', () => {
		expect(startHere(catalog, 'poe1').map((t) => t.id)).toEqual(['pob', 'awakened', 'ninja']);
	});

	it('skips categories without a pick and honours the cap', () => {
		expect(startHere(catalog, 'poe2', 2).map((t) => t.id)).toEqual(['pob', 'exchange2']);
	});
});

describe('categoryCounts', () => {
	it('keeps every category, with per-game counts and the description', () => {
		expect(categoryCounts(catalog, 'poe2')).toEqual([
			{ id: 'build', name: 'Build', description: undefined, count: 1 },
			{ id: 'trade', name: 'Trade', description: undefined, count: 2 },
			{ id: 'maps', name: 'Maps', description: undefined, count: 0 },
			{ id: 'data', name: 'Data', description: 'Numbers.', count: 2 }
		]);
	});
});
