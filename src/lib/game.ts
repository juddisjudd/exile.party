import { Game } from './catalog/schema';

/** Keep in sync with the inline redirect script in src/app.html. */
export const GAME_KEY = 'exile.game';

/** The slice of Storage the chooser needs, so tests can hand in a plain object. */
export interface GameStore {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** The layout reads this back through readGame on client-side navigation; the inline
 *  script in app.html covers full loads. */
export function rememberGame(game: Game, store: GameStore | null | undefined): void {
	try {
		store?.setItem(GAME_KEY, game);
	} catch {
		/* private mode: the chooser shows again next visit */
	}
}

/** The page's localStorage, or null where reading the property itself throws (site data blocked). */
export function gameStore(): GameStore | null {
	try {
		return localStorage;
	} catch {
		return null;
	}
}

/** The remembered game, or null if there is none, it fails to parse, or the store throws. */
export function readGame(store: GameStore | null | undefined): Game | null {
	try {
		const parsed = Game.safeParse(store?.getItem(GAME_KEY));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
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
