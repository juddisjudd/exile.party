import { describe, expect, it } from 'vitest';
import { relatedTools } from './related';
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
	screenshots: [],
	...over
});

const subject = tool({
	id: 'me',
	category: 'trade',
	tags: ['overlay', 'price-check'],
	games: ['poe1']
});
const all = [
	subject,
	tool({ id: 'same-cat', name: 'B', category: 'trade', games: ['poe1'] }),
	tool({
		id: 'two-tags',
		name: 'A',
		category: 'crafting',
		tags: ['overlay', 'price-check'],
		games: ['poe1']
	}),
	tool({ id: 'one-tag', name: 'C', category: 'crafting', tags: ['overlay'], games: ['poe1'] }),
	tool({ id: 'game-only', name: 'D', category: 'crafting', games: ['poe1'] }),
	tool({ id: 'unrelated', name: 'E', category: 'crafting', games: ['poe2'] })
];

describe('relatedTools', () => {
	it('ranks same category above shared tags above a shared game, and never returns the tool itself', () => {
		expect(relatedTools(subject, all, 3).map((t) => t.id)).toEqual([
			'same-cat',
			'two-tags',
			'one-tag'
		]);
	});
	it('takes as many as it can find, and nothing unrelated', () => {
		expect(relatedTools(subject, all, 10).map((t) => t.id)).toEqual([
			'same-cat',
			'two-tags',
			'one-tag',
			'game-only'
		]);
	});
	it('breaks ties by name', () => {
		const list = [
			subject,
			tool({ id: 'b', name: 'Bravo', category: 'trade' }),
			tool({ id: 'a', name: 'Alpha', category: 'trade' })
		];
		expect(relatedTools(subject, list).map((t) => t.id)).toEqual(['a', 'b']);
	});
});
