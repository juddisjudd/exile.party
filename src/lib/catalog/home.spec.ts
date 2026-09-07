import { describe, expect, it } from 'vitest';
import { countByGame, groupByCategory, sectionPreview } from './home';
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
	screenshots: [],
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

describe('groupByCategory', () => {
	const categories = [
		{ id: 'trade', name: 'Trade' },
		{ id: 'crafting', name: 'Crafting' },
		{ id: 'community', name: 'Community' }
	];
	const tools = [
		tool({ id: 'z', name: 'Zeta', category: 'trade' }),
		tool({ id: 'a', name: 'alpha', category: 'trade' }),
		tool({ id: 'c', name: 'Craft', category: 'crafting' })
	];

	it('keeps catalogue order, sorts names inside a group, and drops empty groups', () => {
		const groups = groupByCategory(categories, tools);
		expect(groups.map((g) => g.id)).toEqual(['trade', 'crafting']);
		expect(groups[0].tools.map((t) => t.id)).toEqual(['a', 'z']);
		expect(groups[0].name).toBe('Trade');
	});
});

describe('sectionPreview', () => {
	it('shows everything when the section fits', () => {
		expect(sectionPreview([1, 2, 3], 6)).toEqual({ shown: [1, 2, 3], hidden: 0 });
		expect(sectionPreview([1, 2, 3, 4, 5, 6], 6)).toEqual({ shown: [1, 2, 3, 4, 5, 6], hidden: 0 });
	});
	it('cuts a long section at the limit and counts the rest', () => {
		expect(sectionPreview([1, 2, 3, 4, 5, 6, 7, 8], 6)).toEqual({
			shown: [1, 2, 3, 4, 5, 6],
			hidden: 2
		});
	});
});
