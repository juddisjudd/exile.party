import { describe, expect, it } from 'vitest';
import { loadCatalog, parseCatalog } from './catalog';

const good = `
categories:
  - id: trade
    name: Trade
tools:
  - id: t
    name: T
    description: Trades things quickly.
    url: https://t.example
    games: [poe1]
    category: trade
    platforms: [web]
    pricing: free
    openSource: false
    status: active
    lastVerified: 2026-09-04
`;

describe('parseCatalog', () => {
	it('parses valid yaml and keeps dates as strings', () => {
		const c = parseCatalog(good);
		expect(c.tools[0].lastVerified).toBe('2026-09-04');
	});

	it('throws with the offending path on invalid yaml', () => {
		expect(() => parseCatalog(good.replace('https://', 'http://'), 'fixture')).toThrow(
			/fixture failed validation[\s\S]*url/
		);
	});
});

describe('tools.yaml', () => {
	it('is valid', () => {
		expect(loadCatalog().categories.length).toBeGreaterThan(0);
	});
});
