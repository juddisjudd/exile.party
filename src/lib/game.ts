import type { Game } from './catalog/schema';

/** Keep in sync with the inline redirect script in src/app.html. */
export const GAME_KEY = 'exile.game';

/** The slice of Storage the chooser needs, so tests can hand in a plain object. */
export interface GameStore {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** Nothing in the app reads this back; the inline script in app.html is the only reader. */
export function rememberGame(game: Game, store: GameStore | null | undefined): void {
	try {
		store?.setItem(GAME_KEY, game);
	} catch {
		/* private mode: the chooser shows again next visit */
	}
}

/* Set by the chooser right before it navigates, read once by the layout's onNavigate,
   so only that one navigation gets the cross-fade. */
let reveal = false;

export function requestReveal(): void {
	reveal = true;
}

export function takeReveal(): boolean {
	const pending = reveal;
	reveal = false;
	return pending;
}
