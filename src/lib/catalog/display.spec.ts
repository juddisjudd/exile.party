import { describe, expect, it } from 'vitest';
import { displayHost, monogram, repoLinks, siteLinks } from './display';
import type { Tool } from './schema';

const tool = (over: Partial<Tool>): Tool => ({
	id: 'x',
	name: 'X',
	description: 'A tool that does things.',
	url: 'https://x.example',
	games: ['poe1', 'poe2'],
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

describe('monogram', () => {
	it.each([
		['Path of Building', 'B'],
		['Path of Exile Wiki', 'W'],
		['Path of Exile 2 Trade', 'T'],
		['poe.ninja', 'n'],
		['PoEDB', 'D'],
		['PoE Lab', 'L'],
		['The Forbidden Trove', 'F'],
		['Craft of Exile', 'C'],
		['Exiled Exchange 2', 'E']
	])('%s -> %s', (name, expected) => {
		expect(monogram(name)).toBe(expected);
	});

	it('falls back to the first character when stripping leaves nothing', () => {
		expect(monogram('PoE')).toBe('P');
	});
});

describe('displayHost', () => {
	it('drops the scheme and a www prefix', () => {
		expect(displayHost('https://www.poewiki.net/wiki/Main')).toBe('poewiki.net');
	});
	it('returns the input when it is not a url', () => {
		expect(displayHost('not a url')).toBe('not a url');
	});
});

describe('siteLinks', () => {
	it('is one entry when a single url covers every game', () => {
		expect(siteLinks(tool({}))).toEqual([{ game: null, url: 'https://x.example' }]);
	});

	it('splits per game when the urls differ', () => {
		const t = tool({ urls: { poe1: 'https://x.example/1', poe2: 'https://x.example/2' } });
		expect(siteLinks(t)).toEqual([
			{ game: 'poe1', url: 'https://x.example/1' },
			{ game: 'poe2', url: 'https://x.example/2' }
		]);
	});

	it('falls back to the main url when only one game has its own link', () => {
		const t = tool({ urls: { poe2: 'https://x.example/2' } });
		expect(siteLinks(t)).toEqual([{ game: null, url: 'https://x.example' }]);
	});
});

describe('repoLinks', () => {
	it('is empty for a closed-source tool', () => {
		expect(repoLinks(tool({}))).toEqual([]);
	});

	it('uses the single source when there is one', () => {
		const t = tool({ openSource: true, source: 'https://github.com/a/b' });
		expect(repoLinks(t)).toEqual([{ game: null, url: 'https://github.com/a/b' }]);
	});

	it('prefers per-game sources when present', () => {
		const t = tool({
			openSource: true,
			source: 'https://github.com/a/b',
			sources: { poe1: 'https://github.com/a/one', poe2: 'https://github.com/a/two' }
		});
		expect(repoLinks(t)).toEqual([
			{ game: 'poe1', url: 'https://github.com/a/one' },
			{ game: 'poe2', url: 'https://github.com/a/two' }
		]);
	});
});
