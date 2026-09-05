import { afterEach, describe, expect, it } from 'vitest';
import { GAME_KEY, gameStore, readGame, rememberGame, requestReveal, takeReveal } from './game';

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

describe('gameStore', () => {
	afterEach(() => {
		delete (globalThis as { localStorage?: unknown }).localStorage;
	});

	it('returns null when there is no localStorage global', () => {
		expect(gameStore()).toBeNull();
	});

	it('returns the global when it is a plain object', () => {
		const store = fakeStore();
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			value: store
		});
		expect(gameStore()).toBe(store);
	});

	it('returns null when reading the property itself throws, as blocked site data does', () => {
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			get() {
				throw new Error('SecurityError');
			}
		});
		expect(gameStore()).toBeNull();
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

describe('readGame', () => {
	it('returns a remembered game', () => {
		const store = fakeStore();
		store.setItem(GAME_KEY, 'poe1');
		expect(readGame(store)).toBe('poe1');
	});

	it('ignores anything that is not a game id', () => {
		const store = fakeStore();
		store.setItem(GAME_KEY, 'poe3');
		expect(readGame(store)).toBeNull();
		expect(readGame(fakeStore())).toBeNull();
		expect(readGame(null)).toBeNull();
	});

	it('survives a store that throws', () => {
		const store = {
			getItem: () => {
				throw new Error('SecurityError');
			},
			setItem: () => {}
		};
		expect(readGame(store)).toBeNull();
	});
});
