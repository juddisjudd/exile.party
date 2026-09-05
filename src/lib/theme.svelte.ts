import { browser } from '$app/environment';

export const THEME_KEY = 'exile.theme';

export type ThemeChoice = 'light' | 'dark' | 'system';
export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'system', 'dark'];

/** Where the reveal starts from, in viewport coordinates. */
export interface Origin {
	x: number;
	y: number;
}

const REVEAL_MS = 650;

function read(): ThemeChoice {
	// The inline script in app.html has already resolved this before hydration.
	if (!browser) return 'system';
	const c = document.documentElement.dataset.themeChoice;
	return c === 'light' || c === 'dark' ? c : 'system';
}

let choice = $state<ThemeChoice>(read());

function apply(next: ThemeChoice) {
	const el = document.documentElement;
	el.dataset.themeChoice = next;
	if (next === 'system') delete el.dataset.theme;
	else el.dataset.theme = next;
}

function persist(next: ThemeChoice) {
	try {
		if (next === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, next);
	} catch {
		/* private mode: choice lasts for the session only */
	}
}

/** Radius that reaches whichever viewport corner is furthest from the origin. */
function coverRadius({ x, y }: Origin): number {
	return Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
}

export const theme = {
	get choice() {
		return choice;
	},

	set(next: ThemeChoice, origin?: Origin) {
		if (next === choice) return;
		choice = next;
		persist(next);

		const el = document.documentElement;
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Unsupported or motion-averse: swap straight over, no reveal.
		if (still || typeof document.startViewTransition !== 'function') {
			apply(next);
			return;
		}

		// Scopes the pseudo-element rules in layout.css to this transition only.
		el.dataset.themeTransition = '';
		const transition = document.startViewTransition(() => apply(next));

		const from = origin ?? { x: innerWidth, y: 0 };
		const radius = coverRadius(from);

		transition.ready
			.then(() =>
				el.animate(
					{
						clipPath: [
							`circle(0px at ${from.x}px ${from.y}px)`,
							`circle(${radius}px at ${from.x}px ${from.y}px)`
						]
					},
					{
						duration: REVEAL_MS,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						pseudoElement: '::view-transition-new(root)'
					}
				)
			)
			.catch(() => {
				/* a transition that gets skipped or interrupted still lands on the right theme */
			});

		transition.finished.finally(() => {
			delete el.dataset.themeTransition;
		});
	}
};
