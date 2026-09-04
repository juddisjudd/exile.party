import { describe, expect, it } from 'vitest';
import { Catalog, Tool } from './schema';

const valid = {
	id: 'example-tool',
	name: 'Example Tool',
	description: 'Does a useful thing for exiles.',
	url: 'https://example.com',
	games: ['poe1'],
	category: 'trade',
	platforms: ['web'],
	pricing: 'free',
	status: 'active',
	lastVerified: '2026-09-04'
};

describe('Tool', () => {
	it('accepts a minimal valid entry and defaults tags', () => {
		const t = Tool.parse(valid);
		expect(t.tags).toEqual([]);
	});

	it.each([
		['unknown key', { ...valid, bogus: 1 }],
		['http url', { ...valid, url: 'http://example.com' }],
		['bad id', { ...valid, id: 'Example Tool' }],
		['empty games', { ...valid, games: [] }],
		['bad date', { ...valid, lastVerified: '2026-13-45' }],
		['urls key not in games', { ...valid, urls: { poe2: 'https://example.com/2' } }],
		['tag with uppercase', { ...valid, tags: ['Bad'] }]
	])('rejects %s', (_, input) => {
		expect(Tool.safeParse(input).success).toBe(false);
	});
});

describe('Catalog', () => {
	const categories = [{ id: 'trade', name: 'Trade' }];

	it('rejects duplicate tool ids', () => {
		const r = Catalog.safeParse({ categories, tools: [valid, valid] });
		expect(r.success).toBe(false);
		expect(r.error?.issues[0].message).toMatch(/duplicate id/);
	});

	it('rejects unknown category references', () => {
		const r = Catalog.safeParse({ categories, tools: [{ ...valid, category: 'nope' }] });
		expect(r.success).toBe(false);
		expect(r.error?.issues[0].message).toMatch(/unknown category/);
	});

	it('rejects an empty category list', () => {
		expect(Catalog.safeParse({ categories: [], tools: [] }).success).toBe(false);
	});
});
