import { describe, expect, it } from 'vitest';
import { GAME_KEY, rememberGame, requestReveal, takeReveal } from './game';

function fakeStore() {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value)
	};
}

describe('rememberGame', () => {
	it('writes the game under the shared key', () => {
		const store = fakeStore();
		rememberGame('poe2', store);
		expect(store.data.get(GAME_KEY)).toBe('poe2');
	});

	it('survives a store that throws, as private mode does', () => {
		const store = {
			getItem: () => null,
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		};
		expect(() => rememberGame('poe1', store)).not.toThrow();
	});

	it('does nothing without a store', () => {
		expect(() => rememberGame('poe1', null)).not.toThrow();
	});
});

describe('reveal flag', () => {
	it('is handed out once per request', () => {
		expect(takeReveal()).toBe(false);
		requestReveal();
		expect(takeReveal()).toBe(true);
		expect(takeReveal()).toBe(false);
	});
});
