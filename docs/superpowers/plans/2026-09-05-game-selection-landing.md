# Game Selection Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page with a split-screen game chooser that remembers the pick, animates the chosen half open, and lands on a new per-game home page at `/poe1` or `/poe2`.

**Architecture:** Pure catalog helpers feed two prerendered routes: the chooser at `/` (two clipped `<a>` panels over official artwork, always dark) and `[game=game]` (today's home layout scoped to one game, plus a "Start here" strip). A tiny `game.ts` module holds the localStorage key and a one-shot reveal flag; an inline script in `app.html` redirects `/` to the remembered game before first paint, and `+layout.svelte` wraps the chooser-to-game navigation in a View Transition the same way the theme reveal already does.

**Tech Stack:** SvelteKit 2 static (adapter-static, `strict: true`), Svelte 5 runes, Tailwind v4 (CSS-first, tokens in `src/lib/styles/tokens.css`), Zod 4, Vitest (server project, node), Playwright e2e against the built site, bun as the runner.

**Spec:** `docs/superpowers/specs/2026-09-05-game-selection-landing-design.md`

## Global Constraints

- Every page is prerendered. No `+server.ts`, no `ssr = false`, no `url.searchParams` in load functions (`src/routes/+layout.ts` has `prerender = true`).
- Internal links go through `resolve` from `$app/paths`. Where a querystring is appended, add the exact comment the codebase already uses: `<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation -->` (or the `//` form in script).
- Svelte 5 runes only: `$props`, `$state`, `$derived`, `$effect`, `onclick={}`, snippets. No `export let`, no `$:`, no `on:click`.
- Colours only through tokens (`text-ink`, `bg-canvas`, `border-line`, `var(--accent-fill)`). Never Tailwind's gray scale or raw hex in components. The one exception is the chooser's art overlay gradient, which is built from the dark canvas value `rgb(20 22 25 / ...)` because it must stay dark in both themes.
- Breakpoints: never hand-write `@media (min-width...)`. In a Svelte `<style>` block use `@reference '../../routes/layout.css';` then `@variant md { ... }`.
- Copy, verbatim: headline "Welcome to the Party, Exile", sub "Explore tools for Path of Exile", prompt "Choose your game", side lines "The original. A decade of tools." and "The sequel. Early access, new systems.", credit "Artwork by Grinding Gear Games. Not affiliated with GGG.", game names "Path of Exile" and "Path of Exile 2".
- localStorage key `exile.game`, values `poe1` | `poe2`. Querystring escape hatch `?choose`.
- Commit messages: imperative, sentence case, no prefix, no attribution lines (matches `git log`).
- Before every commit: `bun run format`, then `bun run lint`, then `bun run check`. All three must be clean.
- Tests run with `bun run test` (Vitest) and `bun run test:e2e` (Playwright). Never `bun test`.
- Artwork source files for Task 4 are already prepared at
  `C:\Users\linki\AppData\Local\Temp\claude\C--www-poetoollist--claude-worktrees-game-selection-landing-001ba6\736849ac-4dae-47fe-a50b-541520c1fe0f\scratchpad\art\production\` (`poe1.jpg`, `poe1.webp`, `poe2.jpg`, `poe2.webp`). They are logo-free crops of GGG's Warden of Eaves and Viper Napuatzi wallpapers, 1800px wide.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/lib/catalog/home.ts` (new) | Pure helpers: `countByGame`, `startHere`, `categoryCounts`. Safe on server and client. |
| `src/lib/catalog/home.spec.ts` (new) | Unit tests for the above with an inline fixture. |
| `src/lib/catalog/display.ts` (modify) | Add `GAME_NAME` next to `GAME_LABEL`. |
| `src/lib/game.ts` (new) | `GAME_KEY`, `rememberGame`, `requestReveal`, `takeReveal`. No runes, no DOM at import time. |
| `src/lib/game.spec.ts` (new) | Unit tests for `game.ts`. |
| `src/params/game.ts` (new) | Param matcher: `poe1` or `poe2`. |
| `src/routes/[game=game]/+page.server.ts` (new) | `entries()` for both games; load returns counts, start-here picks, category counts. |
| `src/routes/[game=game]/+page.svelte` (new) | Per-game home: hero, Start here, categories, footer. |
| `src/lib/components/TopBar.svelte` (modify) | New `context` and `onsearch` props. |
| `scripts/og.ts` (modify) | Two more page cards, `poe1.png` and `poe2.png`. |
| `src/lib/styles/tokens.css` (modify) | Dark token block also applies under `[data-force-theme='dark']`. |
| `src/lib/assets/chooser/poe{1,2}.{jpg,webp}` (new) | The artwork. |
| `src/lib/components/GamePanel.svelte` (new) | One clipped half: art, shade, label, hover and expand states. |
| `src/routes/+page.server.ts` (modify) | Returns per-game counts only. |
| `src/routes/+page.svelte` (modify) | The chooser. Owns seam geometry, hover and expanding state, the pick handler. |
| `src/app.html` (modify) | Redirect script. |
| `src/routes/+layout.svelte` (modify) | `onNavigate` view transition when a reveal was requested. |
| `src/routes/layout.css` (modify) | `html[data-choose-transition]` cross-fade rules. |
| `e2e/site.e2e.ts` (modify) | Old home tests move to `/poe1`; chooser, redirect and transition tests added. |

---

### Task 1: Catalog helpers for the per-game pages

**Files:**
- Create: `src/lib/catalog/home.ts`
- Create: `src/lib/catalog/home.spec.ts`
- Modify: `src/lib/catalog/display.ts` (after the `GAME_LABEL` line)

**Interfaces:**
- Consumes: `Catalog`, `Game`, `Tool` types from `src/lib/catalog/schema.ts`.
- Produces:
  - `countByGame(tools: readonly Tool[]): Record<Game, number>`
  - `startHere(catalog: Catalog, game: Game, limit?: number): Tool[]` (default limit 6)
  - `categoryCounts(catalog: Catalog, game: Game): CategoryCount[]` where `CategoryCount = { id: string; name: string; description?: string; count: number }`
  - `GAME_NAME: { poe1: 'Path of Exile'; poe2: 'Path of Exile 2' }` in `display.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/catalog/home.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { categoryCounts, countByGame, startHere } from './home';
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

describe('startHere', () => {
	it('takes the first editor pick of each category, in category order', () => {
		expect(startHere(catalog, 'poe2').map((t) => t.id)).toEqual(['pob', 'exchange2', 'ninja']);
	});

	it('ignores picks for the other game', () => {
		expect(startHere(catalog, 'poe1').map((t) => t.id)).toEqual(['pob', 'awakened', 'ninja']);
	});

	it('skips categories without a pick and honours the cap', () => {
		expect(startHere(catalog, 'poe2', 2).map((t) => t.id)).toEqual(['pob', 'exchange2']);
	});
});

describe('categoryCounts', () => {
	it('keeps every category, with per-game counts and the description', () => {
		expect(categoryCounts(catalog, 'poe2')).toEqual([
			{ id: 'build', name: 'Build', description: undefined, count: 1 },
			{ id: 'trade', name: 'Trade', description: undefined, count: 2 },
			{ id: 'maps', name: 'Maps', description: undefined, count: 0 },
			{ id: 'data', name: 'Data', description: 'Numbers.', count: 2 }
		]);
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- home`
Expected: FAIL, `Failed to resolve import "./home"`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/catalog/home.ts`:

```ts
import type { Catalog, Game, Tool } from './schema';

export interface CategoryCount {
	id: string;
	name: string;
	description?: string;
	count: number;
}

export function countByGame(tools: readonly Tool[]): Record<Game, number> {
	return {
		poe1: tools.filter((t) => t.games.includes('poe1')).length,
		poe2: tools.filter((t) => t.games.includes('poe2')).length
	};
}

/**
 * The first editor's pick in each category, in category order, capped.
 * Categories without a pick for this game are skipped, so a new player sees a spread of
 * categories rather than every pick in the directory.
 */
export function startHere(catalog: Catalog, game: Game, limit = 6): Tool[] {
	const picks: Tool[] = [];
	for (const category of catalog.categories) {
		if (picks.length === limit) break;
		const pick = catalog.tools.find(
			(t) => t.category === category.id && t.editorsPick && t.games.includes(game)
		);
		if (pick) picks.push(pick);
	}
	return picks;
}

export function categoryCounts(catalog: Catalog, game: Game): CategoryCount[] {
	return catalog.categories.map((c) => ({
		id: c.id,
		name: c.name,
		description: c.description,
		count: catalog.tools.filter((t) => t.category === c.id && t.games.includes(game)).length
	}));
}
```

In `src/lib/catalog/display.ts`, directly after `export const GAME_LABEL = { poe1: 'PoE 1', poe2: 'PoE 2' } as const;` add:

```ts
export const GAME_NAME = { poe1: 'Path of Exile', poe2: 'Path of Exile 2' } as const;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- home`
Expected: PASS, 5 tests.

- [ ] **Step 5: Format, lint, check, commit**

```bash
bun run format && bun run lint && bun run check
git add src/lib/catalog/home.ts src/lib/catalog/home.spec.ts src/lib/catalog/display.ts
git commit -m "Add per-game catalog helpers"
```

---

### Task 2: Game memory and the reveal flag

**Files:**
- Create: `src/lib/game.ts`
- Create: `src/lib/game.spec.ts`

**Interfaces:**
- Consumes: `Game` type from `src/lib/catalog/schema.ts`.
- Produces:
  - `GAME_KEY = 'exile.game'`
  - `interface GameStore { getItem(key: string): string | null; setItem(key: string, value: string): void }`
  - `rememberGame(game: Game, store: GameStore | null | undefined): void`
  - `requestReveal(): void`
  - `takeReveal(): boolean` (true once per request, then false)

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- game.spec`
Expected: FAIL, `Failed to resolve import "./game"`.

- [ ] **Step 3: Implement the module**

Create `src/lib/game.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- game.spec`
Expected: PASS, 4 tests.

- [ ] **Step 5: Format, lint, check, commit**

```bash
bun run format && bun run lint && bun run check
git add src/lib/game.ts src/lib/game.spec.ts
git commit -m "Add game memory and reveal flag"
```

---

### Task 3: Per-game home page at /poe1 and /poe2

**Files:**
- Create: `src/params/game.ts`
- Create: `src/routes/[game=game]/+page.server.ts`
- Create: `src/routes/[game=game]/+page.svelte`
- Modify: `src/lib/components/TopBar.svelte` (whole file replaced below)
- Modify: `scripts/og.ts` (the `jobs` array in `main()`)
- Modify: `e2e/site.e2e.ts` (append two tests)

**Interfaces:**
- Consumes: `startHere`, `categoryCounts` from Task 1; `GAME_NAME` from `display.ts`; `Game` zod enum and type from `schema.ts`; `loadCatalog` from `$lib/server/catalog`; `ToolCard`, `HeroOcean`, `SiteFooter`, `Meta`, `submitDialog` as they exist today.
- Produces: routes `/poe1` and `/poe2`; `TopBar` props `context?: Game` and `onsearch?: (query: string) => void`.

- [ ] **Step 1: Add the param matcher**

Create `src/params/game.ts`:

```ts
import type { ParamMatcher } from '@sveltejs/kit';
import { Game } from '$lib/catalog/schema';

export const match = ((param) => Game.safeParse(param).success) satisfies ParamMatcher;
```

- [ ] **Step 2: Add the server load**

Create `src/routes/[game=game]/+page.server.ts`:

```ts
import type { EntryGenerator, PageServerLoad } from './$types';
import { categoryCounts, startHere } from '$lib/catalog/home';
import { Game } from '$lib/catalog/schema';
import { loadCatalog } from '$lib/server/catalog';

export const entries: EntryGenerator = () => Game.options.map((game) => ({ game }));

export const load = (({ params }) => {
	const game = Game.parse(params.game);
	const catalog = loadCatalog();
	return {
		game,
		total: catalog.tools.filter((t) => t.games.includes(game)).length,
		startHere: startHere(catalog, game),
		categories: categoryCounts(catalog, game),
		builtAt: new Date().toISOString()
	};
}) satisfies PageServerLoad;
```

- [ ] **Step 3: Replace TopBar with the version that knows about a game context**

Replace the whole of `src/lib/components/TopBar.svelte` with:

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
	import { GAME_LABEL } from '$lib/catalog/display';
	import type { Game } from '$lib/catalog/schema';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		/** Omitted outside the directory, where there is nothing to filter. */
		game?: Game | null;
		query?: string;
		compact?: boolean;
		/** On a per-game page: names the game and offers the way back to the chooser. */
		context?: Game;
		/** When set, Enter in the search box hands the query over instead of filtering in place. */
		onsearch?: (query: string) => void;
	}

	let {
		game = $bindable(null),
		query = $bindable(''),
		compact = false,
		context,
		onsearch
	}: Props = $props();

	let search = $state<HTMLInputElement | null>(null);

	const games: { value: Game | null; label: string }[] = [
		{ value: null, label: 'All' },
		{ value: 'poe1', label: 'PoE 1' },
		{ value: 'poe2', label: 'PoE 2' }
	];

	function typing(target: EventTarget | null): boolean {
		return (
			target instanceof HTMLElement &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
		);
	}

	function onkeydown(event: KeyboardEvent) {
		if (compact) return;
		if (event.key === '/' && !typing(event.target)) {
			event.preventDefault();
			search?.focus();
		} else if (event.key === 'Escape' && document.activeElement === search) {
			query = '';
			search?.blur();
		}
	}

	function submit(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !onsearch) return;
		event.preventDefault();
		onsearch(query);
	}
</script>

<svelte:window {onkeydown} />

{#snippet gameToggle()}
	<div
		class="flex items-center gap-0.5 rounded-md border border-line bg-raised/60 p-0.5"
		role="group"
		aria-label="Game"
	>
		{#each games as option (option.label)}
			<button
				type="button"
				aria-pressed={game === option.value}
				onclick={() => (game = option.value)}
				class="rounded-[4px] border px-2 py-[3px] text-[12.5px] transition-colors duration-100
					{game === option.value
					? 'border-line bg-surface text-ink'
					: 'border-transparent text-faint hover:text-ink'}"
			>
				{option.label}
			</button>
		{/each}
	</div>
{/snippet}

{#snippet contextPill(current: Game)}
	<div
		class="flex items-center gap-0.5 rounded-md border border-line bg-raised/60 p-0.5"
		role="group"
		aria-label="Game"
	>
		<span class="rounded-[4px] border border-line bg-surface px-2 py-[3px] text-[12.5px] text-ink">
			{GAME_LABEL[current]}
		</span>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation -->
		<a
			href="{resolve('/')}?choose"
			class="flex items-center gap-1.5 rounded-[4px] border border-transparent px-2 py-[3px] text-[12.5px] text-faint transition-colors duration-100 hover:text-ink"
		>
			<svg
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.3"
				aria-hidden="true"
				class="size-3.5"
			>
				<path d="M3 5.5h9l-2.5-2.5M13 10.5H4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			Switch game
		</a>
	</div>
{/snippet}

{#snippet searchBox(extra: string)}
	<div class="relative {extra}">
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.3"
			aria-hidden="true"
			class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint"
		>
			<circle cx="7" cy="7" r="4.5" />
			<path d="m10.5 10.5 3 3" stroke-linecap="round" />
		</svg>
		<input
			bind:this={search}
			bind:value={query}
			type="search"
			placeholder={context ? `Search ${GAME_LABEL[context]} tools` : 'Search tools'}
			aria-label="Search tools"
			onkeydown={submit}
			class="h-8 w-full rounded-md border border-line bg-surface pr-9 pl-8 text-[13px] text-ink transition-colors duration-100 outline-none placeholder:text-faint focus:border-accent-line"
		/>
		<kbd
			class="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-line px-1 font-sans text-[10px] text-faint sm:block"
			>/</kbd
		>
	</div>
{/snippet}

<header class="sticky top-0 z-40 border-b border-line bg-canvas">
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6">
		<div class="flex h-14 items-center gap-4">
			<a
				href={resolve('/')}
				class="shrink-0 text-[15px] font-medium tracking-tight text-ink"
				aria-label="exile.party home"
			>
				exile<span class="text-faint">.</span>party
			</a>

			{#if context}
				<div class="hidden md:block">{@render contextPill(context)}</div>
			{:else if !compact}
				<div class="hidden md:block">{@render gameToggle()}</div>
			{/if}

			<div class="ml-auto flex items-center gap-3">
				{#if !compact}
					{@render searchBox('hidden w-56 md:block lg:w-72')}
				{/if}
				<ThemeToggle />
			</div>
		</div>

		{#if !compact}
			<div class="flex items-center gap-3 pb-3 md:hidden">
				{@render searchBox('flex-1')}
				{#if context}
					{@render contextPill(context)}
				{:else}
					{@render gameToggle()}
				{/if}
			</div>
		{/if}
	</div>
</header>
```

Behaviour that must not change: `/tools` still passes `bind:game` and `bind:query` and gets the All / PoE 1 / PoE 2 toggle; `compact` pages still get brand plus theme toggle only.

- [ ] **Step 4: Write the page**

Create `src/routes/[game=game]/+page.svelte`:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { GAME_NAME } from '$lib/catalog/display';
	import { isStale } from '$lib/catalog/filter';
	import HeroOcean from '$lib/components/HeroOcean.svelte';
	import Meta from '$lib/components/Meta.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import ToolCard from '$lib/components/ToolCard.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { submitDialog } from '$lib/submit.svelte';

	let { data } = $props();

	const name = $derived(GAME_NAME[data.game]);
	/** The directory, already filtered to this game. Every outbound link on the page starts here. */
	const directory = $derived(`${resolve('/tools')}?game=${data.game}`);

	function search(query: string) {
		const q = query.trim();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation
		goto(q ? `${directory}&q=${encodeURIComponent(q)}` : directory);
	}
</script>

<Meta
	title="{name} tools · exile.party"
	description="{data.total} third-party tools for {name}. Every listing says what platform it runs on, what it costs, and whether the source is open."
	image="{data.game}.png"
	path="/{data.game}"
/>

<TopBar context={data.game} onsearch={search} />

<main class="flex-1 pb-16">
	<div class="relative isolate overflow-hidden">
		<!-- Held to the content column so the swell ends where the text and categories end. -->
		<div
			class="pointer-events-none absolute inset-0 -z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6"
		>
			<HeroOcean class="h-full w-full" />
		</div>
		<section class="mx-auto w-full max-w-[1180px] px-4 py-20 sm:px-6 sm:py-28">
			<div class="max-w-2xl">
				<p
					class="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.09em] text-faint uppercase"
				>
					<span>{name}</span>
					<span class="size-[3px] rounded-full bg-faint" aria-hidden="true"></span>
					<span class="tabular-nums">{data.total} tools</span>
				</p>
				<h1
					class="mt-4 text-[36px] leading-[1.05] font-medium tracking-tight text-ink sm:text-[48px]"
				>
					Tools for {name}
				</h1>
				<p class="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
					{data.total} community tools for {name}. Every listing says what platform it runs on, what
					it costs, and whether the source is open.
				</p>
				<div class="mt-8 flex flex-wrap gap-2.5">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation -->
					<a
						href={directory}
						class="inline-flex h-9 items-center rounded-md bg-accent-fill px-4 text-[13.5px] font-medium text-accent-on-fill transition-opacity duration-100 hover:opacity-90"
					>
						Browse all {data.total} tools
					</a>
					<button
						type="button"
						onclick={() => submitDialog.show()}
						class="inline-flex h-9 items-center rounded-md border border-line px-4 text-[13.5px] text-muted transition-colors duration-100 hover:border-line-strong hover:text-ink"
					>
						Submit a tool
					</button>
				</div>
			</div>
		</section>
	</div>

	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<section class="border-t border-line py-10" aria-labelledby="start-here">
			<div class="flex items-center gap-3">
				<h2 id="start-here" class="text-[11px] font-medium tracking-[0.09em] text-faint uppercase">
					Start here
				</h2>
				<span class="h-px flex-1 bg-line"></span>
				<span class="text-[12.5px] text-faint">One editor&rsquo;s pick per category</span>
			</div>
			<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.startHere as tool (tool.id)}
					<ToolCard {tool} stale={isStale(tool.lastVerified, data.builtAt)} />
				{/each}
			</ul>
		</section>

		<section class="border-t border-line py-10">
			<h2 class="text-[11px] font-medium tracking-[0.09em] text-faint uppercase">Categories</h2>
			<ul class="mt-3 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.categories as category (category.id)}
					<li>
						{#if category.count === 0}
							<!-- Shown so the gap is visible, but there is nothing to browse yet. -->
							<span
								class="flex items-baseline justify-between gap-4 border-b border-line py-3 text-faint/45"
							>
								<span class="text-[14px]">{category.name}</span>
								<span class="text-[12px] tabular-nums">0</span>
							</span>
						{:else}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation -->
							<a
								href="{directory}&cat={category.id}"
								class="flex items-baseline justify-between gap-4 border-b border-line py-3 transition-colors duration-100 hover:border-line-strong"
							>
								<span class="text-[14px] text-ink">{category.name}</span>
								<span class="text-[12px] text-faint tabular-nums">{category.count}</span>
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	</div>
</main>

<SiteFooter />
```

- [ ] **Step 5: Add the two OG cards**

In `scripts/og.ts`, inside `main()`, after the `maintainers.png` entry in the `jobs` array (before the closing `];`), add:

```ts
		{
			file: 'poe1.png',
			html: pageCard(
				'Tools for Path of Exile',
				`${catalog.tools.filter((t) => t.games.includes('poe1')).length} community tools for Path of Exile. Every listing says what platform it runs on, what it costs, and whether the source is open.`,
				'Path of Exile'
			)
		},
		{
			file: 'poe2.png',
			html: pageCard(
				'Tools for Path of Exile 2',
				`${catalog.tools.filter((t) => t.games.includes('poe2')).length} community tools for Path of Exile 2. Every listing says what platform it runs on, what it costs, and whether the source is open.`,
				'Path of Exile 2'
			)
		},
```

- [ ] **Step 6: Build to prove both pages prerender**

Run: `bun run build`
Expected: ends with the adapter-static summary and no "route was not prerendered" error. `ls build` shows `poe1.html` and `poe2.html`; `ls static/og` shows `poe1.png` and `poe2.png`.

- [ ] **Step 7: Add the e2e tests**

Append to `e2e/site.e2e.ts`:

```ts
test('a game page has a start-here strip and links into its filtered directory', async ({
	page
}) => {
	await page.goto('/poe2');
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile 2');
	await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
	await expect(page.locator('a[href^="/tools/"]').first()).toBeVisible();
	await page.getByRole('link', { name: /^Browse all \d+ tools$/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe2$/);
});

test('the game page search hands the query to the directory', async ({ page }) => {
	await page.goto('/poe1');
	const search = page.getByLabel('Search tools').first();
	await search.fill('trade');
	await search.press('Enter');
	await expect(page).toHaveURL(/\/tools\?game=poe1&q=trade$/);
	await expect(page.locator('h1')).toHaveText('All tools');
});

test('the switch-game link reaches the chooser with the escape-hatch querystring', async ({
	page
}) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: 'Switch game' }).first().click();
	await expect(page).toHaveURL(/\/\?choose$/);
});
```

The third test passes today because `/?choose` still serves the existing home page; Task 4 replaces that page and the test keeps passing.

- [ ] **Step 8: Run the e2e suite**

Run: `bun run test:e2e`
Expected: every test passes, including the three new ones. (Existing tests still target the old `/`; they are moved in Task 4.)

- [ ] **Step 9: Format, lint, check, commit**

```bash
bun run format && bun run lint && bun run check
git add src/params/game.ts "src/routes/[game=game]" src/lib/components/TopBar.svelte scripts/og.ts e2e/site.e2e.ts
git commit -m "Add per-game home pages at /poe1 and /poe2"
```

---

### Task 4: The chooser at /, with memory and redirect

**Files:**
- Modify: `src/lib/styles/tokens.css` (the `:root[data-theme='dark']` selector)
- Create: `src/lib/assets/chooser/poe1.jpg`, `poe1.webp`, `poe2.jpg`, `poe2.webp` (copied)
- Create: `src/lib/components/GamePanel.svelte`
- Modify: `src/routes/+page.server.ts` (whole file)
- Modify: `src/routes/+page.svelte` (whole file)
- Modify: `src/app.html` (add a script)
- Modify: `e2e/site.e2e.ts` (move old home tests, add chooser tests)

**Interfaces:**
- Consumes: `countByGame` (Task 1), `rememberGame` (Task 2), `GAME_NAME` (Task 1), route `/[game=game]` (Task 3).
- Produces: `GamePanel` props `{ game: Game; count: number; hovered: Game | null; expanding: Game | null; onhover: (game: Game | null) => void; onpick: (game: Game, href: string) => void }`. The chooser sets CSS custom properties `--seam-top` and `--seam-bottom` (percent strings) and `data-expanding` on its root. Task 5 fills in the `expanding` behaviour; in this task it stays `null`.

- [ ] **Step 1: Let a subtree force the dark tokens**

In `src/lib/styles/tokens.css`, change the explicit-dark selector line

```css
:root[data-theme='dark'] {
```

to

```css
/* The chooser is art-led and always dark, whatever the theme: it forces this block on its own subtree. */
:root[data-theme='dark'],
[data-force-theme='dark'] {
```

Nothing else in the file changes.

- [ ] **Step 2: Copy the artwork in**

```bash
mkdir -p src/lib/assets/chooser
cp "C:/Users/linki/AppData/Local/Temp/claude/C--www-poetoollist--claude-worktrees-game-selection-landing-001ba6/736849ac-4dae-47fe-a50b-541520c1fe0f/scratchpad/art/production/"poe1.jpg src/lib/assets/chooser/
cp "C:/Users/linki/AppData/Local/Temp/claude/C--www-poetoollist--claude-worktrees-game-selection-landing-001ba6/736849ac-4dae-47fe-a50b-541520c1fe0f/scratchpad/art/production/"poe1.webp src/lib/assets/chooser/
cp "C:/Users/linki/AppData/Local/Temp/claude/C--www-poetoollist--claude-worktrees-game-selection-landing-001ba6/736849ac-4dae-47fe-a50b-541520c1fe0f/scratchpad/art/production/"poe2.jpg src/lib/assets/chooser/
cp "C:/Users/linki/AppData/Local/Temp/claude/C--www-poetoollist--claude-worktrees-game-selection-landing-001ba6/736849ac-4dae-47fe-a50b-541520c1fe0f/scratchpad/art/production/"poe2.webp src/lib/assets/chooser/
ls -la src/lib/assets/chooser
```

Expected: four files, roughly 226 KB, 102 KB, 235 KB, 159 KB.

- [ ] **Step 3: Write the panel component**

Create `src/lib/components/GamePanel.svelte`:

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
	import poe1Jpg from '$lib/assets/chooser/poe1.jpg';
	import poe1Webp from '$lib/assets/chooser/poe1.webp';
	import poe2Jpg from '$lib/assets/chooser/poe2.jpg';
	import poe2Webp from '$lib/assets/chooser/poe2.webp';
	import { GAME_NAME } from '$lib/catalog/display';
	import type { Game } from '$lib/catalog/schema';

	interface Props {
		game: Game;
		count: number;
		/** The half the pointer or keyboard focus is on, if any. */
		hovered: Game | null;
		/** The half that was picked and is growing to fill the viewport. */
		expanding: Game | null;
		onhover: (game: Game | null) => void;
		onpick: (game: Game, href: string) => void;
	}

	let { game, count, hovered, expanding, onhover, onpick }: Props = $props();

	const ART = {
		poe1: { jpg: poe1Jpg, webp: poe1Webp, line: 'The original. A decade of tools.' },
		poe2: { jpg: poe2Jpg, webp: poe2Webp, line: 'The sequel. Early access, new systems.' }
	} as const;

	const side = $derived(game === 'poe1' ? 'left' : 'right');
	const href = $derived(resolve('/[game=game]', { game }));
	const hot = $derived(hovered === game || expanding === game);
	const dimmed = $derived(hovered !== null && hovered !== game);
	const fading = $derived(expanding !== null && expanding !== game);
</script>

<!-- A real link: works without JS, is focusable, and hover preloads the game page. -->
<a
	{href}
	class={[
		'panel absolute inset-0 block outline-none',
		side === 'left' ? 'panel-left' : 'panel-right'
	]}
	data-hot={hot ? '' : undefined}
	data-dimmed={dimmed ? '' : undefined}
	data-fading={fading ? '' : undefined}
	data-expanding={expanding === game ? '' : undefined}
	aria-label="{GAME_NAME[game]} tools, {count} listed"
	onpointerenter={() => onhover(game)}
	onpointerleave={() => onhover(null)}
	onfocus={() => onhover(game)}
	onblur={() => onhover(null)}
	onclick={(event) => {
		event.preventDefault();
		onpick(game, href);
	}}
>
	<picture class="art pointer-events-none absolute">
		<source type="image/webp" srcset={ART[game].webp} />
		<img
			src={ART[game].jpg}
			alt=""
			class="size-full object-cover"
			style:object-position={side === 'left' ? '40% 50%' : '60% 50%'}
			loading="eager"
			fetchpriority="high"
			decoding="async"
		/>
	</picture>
	<div class="shade pointer-events-none absolute inset-0" aria-hidden="true"></div>
	<div
		class="label absolute bottom-9 flex max-w-[440px] flex-col gap-1.5 md:bottom-16 md:gap-2 {side ===
		'left'
			? 'left-5 items-start text-left md:left-16'
			: 'right-5 items-end text-right md:right-16'}"
	>
		<span
			class="text-[24px] leading-[1.1] font-medium tracking-tight text-ink [text-shadow:0_1px_12px_rgb(0_0_0/0.45)] md:text-[30px]"
		>
			{GAME_NAME[game]}
		</span>
		<span class="text-[13.5px] leading-snug text-muted md:text-[14.5px]">{ART[game].line}</span>
		<span
			class="mt-1.5 flex items-center gap-3 text-[12.5px] text-muted md:mt-2 md:gap-3.5 md:text-[13px] {side ===
			'left'
				? ''
				: 'flex-row-reverse'}"
		>
			<span
				class="ring grid size-[30px] place-items-center rounded-full border border-line-strong bg-canvas/35 text-muted transition-colors duration-200 md:size-9"
				aria-hidden="true"
			>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					class="size-3.5"
				>
					<path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
			<span class="hidden md:inline">Select</span>
			<span class="hidden size-[3px] rounded-full bg-faint md:inline-block" aria-hidden="true"></span>
			<span class="text-faint tabular-nums">{count} tools</span>
		</span>
	</div>
</a>

<style>
	@reference '../../routes/layout.css';

	/* Mobile first: the halves stack, seam from 52% on the left edge to 48% on the right.
	   Every polygon keeps four points in the same order so clip-path can animate between them. */
	.panel {
		transition:
			clip-path 200ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 450ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.panel-left {
		clip-path: polygon(0 0, 100% 0, 100% 48%, 0 52%);
	}
	.panel-right {
		clip-path: polygon(0 52%, 100% 48%, 100% 100%, 0 100%);
	}
	.panel[data-expanding] {
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		transition-duration: 450ms;
	}
	.panel[data-fading] {
		opacity: 0;
	}

	/* The image box covers only this half, so object-fit shows the intended crop. */
	.art {
		left: 0;
		width: 100%;
		transition:
			left 450ms cubic-bezier(0.4, 0, 0.2, 1),
			width 450ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.panel-left .art {
		top: 0;
		height: 52%;
	}
	.panel-right .art {
		top: 48%;
		height: 52%;
	}

	/* Dark in both themes: the values are the dark canvas token, not a theme variable. */
	.shade {
		background: linear-gradient(
			to top,
			rgb(20 22 25 / 0.94) 0%,
			rgb(20 22 25 / 0.5) 34%,
			rgb(20 22 25 / 0.14) 64%,
			rgb(20 22 25 / 0.55) 100%
		);
	}

	.label {
		transition: opacity 450ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.panel[data-expanding] .label {
		opacity: 0;
	}

	img {
		transition: filter 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (hover: hover) {
		.panel[data-hot] img {
			filter: brightness(1.06);
		}
		.panel[data-dimmed] img {
			filter: brightness(0.55) saturate(0.7);
		}
	}

	/* Hover on pointer devices, focus everywhere, light the arrow the same way. */
	.panel[data-hot] .ring,
	.panel:focus-visible .ring {
		background-color: var(--accent-fill);
		border-color: var(--accent-fill);
		color: var(--accent-on-fill);
	}

	@variant md {
		.panel-left {
			clip-path: polygon(0 0, var(--seam-top) 0, var(--seam-bottom) 100%, 0 100%);
		}
		.panel-right {
			clip-path: polygon(var(--seam-top) 0, 100% 0, 100% 100%, var(--seam-bottom) 100%);
		}
		.panel[data-expanding] {
			clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		}
		.panel-left .art,
		.panel-right .art {
			top: 0;
			height: 100%;
		}
		.panel-left .art {
			left: 0;
			width: 62%;
		}
		.panel-right .art {
			left: 38%;
			width: 62%;
		}
		.panel[data-expanding] .art {
			left: 0;
			width: 100%;
		}
	}
</style>
```

If `@variant md` is rejected inside the Svelte style block at build time, replace that one line with `@media (width >= 48rem) {` (48rem is Tailwind's `md`) and add a comment saying so.

- [ ] **Step 4: Replace the home load**

Replace the whole of `src/routes/+page.server.ts` with:

```ts
import type { PageServerLoad } from './$types';
import { countByGame } from '$lib/catalog/home';
import { loadCatalog } from '$lib/server/catalog';

export const load = (() => ({
	counts: countByGame(loadCatalog().tools)
})) satisfies PageServerLoad;
```

- [ ] **Step 5: Replace the home page with the chooser**

Replace the whole of `src/routes/+page.svelte` with:

```svelte
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Game } from '$lib/catalog/schema';
	import GamePanel from '$lib/components/GamePanel.svelte';
	import Meta from '$lib/components/Meta.svelte';
	import { rememberGame } from '$lib/game';

	let { data } = $props();

	/* Seam geometry, desktop: from 54% at the top to 46% at the bottom, shifting 8% away from
	   the hovered half. Mobile geometry lives in GamePanel's stylesheet. */
	const SEAM_TOP = 54;
	const SEAM_BOTTOM = 46;
	const SHIFT = 8;

	let hovered = $state<Game | null>(null);
	let expanding = $state<Game | null>(null);

	const shift = $derived(hovered === 'poe2' ? -SHIFT : hovered === 'poe1' ? SHIFT : 0);
	const seamTop = $derived(SEAM_TOP + shift);
	const seamBottom = $derived(SEAM_BOTTOM + shift);

	/* Touch fires pointerenter on tap; only real pointers get the hover move. */
	const canHover = browser && matchMedia('(hover: hover)').matches;

	function hover(game: Game | null) {
		if (canHover && expanding === null) hovered = game;
	}

	async function pick(game: Game, href: string) {
		if (expanding !== null) return;
		rememberGame(game, localStorage);
		await goto(href);
	}
</script>

<!-- No brand suffix: at 58 characters this already fills a search result, and og:site_name
     carries the brand into social cards. -->
<Meta
	title="Curated directory of Path of Exile 1 & 2 third-party tools"
	description="A curated directory of {data.counts.poe1 + data.counts.poe2} third-party tools for Path of Exile 1 and 2. Pick your game, then browse by category, platform, price, and whether the source is open."
	image="home.png"
	path="/"
/>

<div
	class="chooser relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink"
	data-force-theme="dark"
	data-expanding={expanding ?? undefined}
	style:--seam-top="{seamTop}%"
	style:--seam-bottom="{seamBottom}%"
>
	<!-- On desktop the band floats over the art; only its link takes pointer events. -->
	<div class="band pointer-events-none relative z-10 md:absolute md:inset-x-0 md:top-0">
		<header class="flex h-14 items-center justify-between px-5 md:px-8">
			<span class="text-[15px] font-medium tracking-tight text-ink">
				exile<span class="text-faint">.</span>party
			</span>
			<a
				href={resolve('/tools')}
				class="pointer-events-auto hidden items-center gap-1.5 text-[13px] text-muted transition-colors duration-100 hover:text-ink md:flex"
			>
				Browse all tools
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					aria-hidden="true"
					class="size-3.5"
				>
					<path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</a>
		</header>
		<div
			class="flex flex-col items-center gap-2.5 px-5 pt-5 pb-8 text-center md:gap-3.5 md:pt-[156px] md:pb-0"
		>
			<h1
				class="text-[34px] leading-[1.08] font-medium tracking-tight text-ink [text-shadow:0_2px_28px_rgb(0_0_0/0.55)] md:text-[58px] md:leading-[1.05]"
			>
				Welcome to the Party, Exile
			</h1>
			<p class="text-[15px] leading-normal text-muted md:text-[17px]">
				Explore tools for Path of Exile
			</p>
			<p
				class="mt-2 flex items-center gap-3 text-[10.5px] tracking-[0.09em] text-faint uppercase md:mt-4 md:gap-3.5 md:text-[11px]"
			>
				<span class="h-px w-7 bg-line-strong md:w-10" aria-hidden="true"></span>
				Choose your game
				<span class="h-px w-7 bg-line-strong md:w-10" aria-hidden="true"></span>
			</p>
		</div>
	</div>

	<div class="relative min-h-[560px] flex-1 md:absolute md:inset-0 md:min-h-0">
		<GamePanel game="poe1" count={data.counts.poe1} {hovered} {expanding} onhover={hover} onpick={pick} />
		<GamePanel game="poe2" count={data.counts.poe2} {hovered} {expanding} onhover={hover} onpick={pick} />

		<!-- Percent coordinates so the seam follows the same numbers the panels clip on. -->
		<svg class="seam pointer-events-none absolute inset-0 size-full" aria-hidden="true">
			<line class="hidden md:block" x1="{seamTop}%" y1="0" x2="{seamBottom}%" y2="100%" />
			<line class="md:hidden" x1="0" y1="52%" x2="100%" y2="48%" />
		</svg>

		<div class="glow pointer-events-none absolute left-1/2 hidden md:block" aria-hidden="true"></div>
	</div>

	<p
		class="credit pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[11px] text-faint/75 md:bottom-4"
	>
		Artwork by Grinding Gear Games. Not affiliated with GGG.
	</p>
</div>

<style>
	.seam line {
		stroke: var(--line-strong);
		stroke-width: 1;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Darkens the art behind the headline block. */
	.glow {
		top: 130px;
		width: 980px;
		height: 460px;
		transform: translateX(-50%);
		background: radial-gradient(
			ellipse at center,
			rgb(20 22 25 / 0.78) 0%,
			rgb(20 22 25 / 0.42) 46%,
			rgb(20 22 25 / 0) 72%
		);
	}

	.band,
	.seam,
	.credit,
	.glow {
		transition: opacity 450ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.chooser[data-expanding] :is(.band, .seam, .credit, .glow) {
		opacity: 0;
	}
</style>
```

- [ ] **Step 6: Add the redirect script**

In `src/app.html`, directly after the closing `</script>` of the theme script (still inside `<head>`, before `%sveltekit.head%`), add:

```html
		<script>
			// Runs before first paint: a remembered game skips the chooser. `?choose` shows it anyway.
			// Keep in sync with GAME_KEY in src/lib/game.ts.
			(() => {
				if (location.pathname !== '/') return;
				if (new URLSearchParams(location.search).has('choose')) return;
				try {
					const game = localStorage.getItem('exile.game');
					if (game === 'poe1' || game === 'poe2') location.replace('/' + game);
				} catch {
					/* private mode */
				}
			})();
		</script>
```

- [ ] **Step 7: Move the old home tests and add the chooser tests**

In `e2e/site.e2e.ts`, replace the first two tests (`home is a hero that links into the directory` and `a home category links to a filtered directory`) with:

```ts
test('a game page is a hero that links into its directory', async ({ page }) => {
	await page.goto('/poe1');
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile');
	await page.getByRole('link', { name: /^Browse all \d+ tools$/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe1$/);
});

test('a game page category links to a filtered directory', async ({ page }) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: /^Trade/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe1&cat=trade$/);
});

test('the chooser offers both games with live counts', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Welcome to the Party, Exile');
	await expect(page.getByRole('link', { name: /^Path of Exile tools, \d+ listed$/ })).toBeVisible();
	await expect(
		page.getByRole('link', { name: /^Path of Exile 2 tools, \d+ listed$/ })
	).toBeVisible();
});

test('picking a game lands on its page and is remembered', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile 2 tools/ }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile 2');
	await expect(page.evaluate(() => localStorage.getItem('exile.game'))).resolves.toBe('poe2');
	await page.goto('/');
	await expect(page).toHaveURL(/\/poe2$/);
	await page.goto('/?choose');
	await expect(page.locator('h1')).toHaveText('Welcome to the Party, Exile');
});

test('the chooser works without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile tools/ }).click();
	await expect(page).toHaveURL(/\/poe1$/);
	await context.close();
});
```

Then change `page.goto('/')` to `page.goto('/poe1')` in these three existing tests, which rely on the submit button, theme toggle and footer that the chooser no longer has: `the submit dialog explains the pull request flow and closes on Escape`, `the theme toggle still lands on the chosen theme through the view transition`, `the footer reaches the maintainers page`.

- [ ] **Step 8: Build, run every test**

Run: `bun run build && bun run test && bun run test:e2e`
Expected: build succeeds; Vitest passes; every e2e test passes.

- [ ] **Step 9: Look at it**

Run: `bun run preview` and open `http://localhost:4173/?choose` at 1440 wide and at 390 wide. Check: seam runs top-right to bottom-left; hovering a half moves the seam and dims the other; the label arrow fills blue on hover; the page is dark in the light theme too (toggle the OS theme or set `localStorage.setItem('exile.theme','light')` on `/poe1` first). Stop the preview.

- [ ] **Step 10: Format, lint, check, commit**

```bash
bun run format && bun run lint && bun run check
git add src/lib/styles/tokens.css src/lib/assets/chooser src/lib/components/GamePanel.svelte src/routes/+page.server.ts src/routes/+page.svelte src/app.html e2e/site.e2e.ts
git commit -m "Replace the home page with a game chooser"
```

---

### Task 5: The reveal transition

**Files:**
- Modify: `src/routes/+page.svelte` (the `pick` function)
- Modify: `src/routes/+layout.svelte` (script block)
- Modify: `src/routes/layout.css` (after the theme-transition rules)
- Modify: `e2e/site.e2e.ts` (append two tests)

**Interfaces:**
- Consumes: `requestReveal`, `takeReveal` (Task 2); `expanding` state and `data-expanding` styling (Task 4).
- Produces: `html[data-choose-transition]` attribute for the duration of the cross-fade.

- [ ] **Step 1: Expand the chosen half before navigating**

In `src/routes/+page.svelte`, change the import line

```ts
	import { rememberGame } from '$lib/game';
```

to

```ts
	import { rememberGame, requestReveal } from '$lib/game';
```

add, under the `SHIFT` constant:

```ts
	/** Matches the clip-path transition in GamePanel. */
	const EXPAND_MS = 450;
```

and replace the `pick` function with:

```ts
	async function pick(game: Game, href: string) {
		if (expanding !== null) return;
		rememberGame(game, localStorage);

		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (still || typeof document.startViewTransition !== 'function') {
			await goto(href);
			return;
		}

		// Stage one: the chosen half grows to cover the viewport while everything else fades.
		expanding = game;
		await new Promise((done) => setTimeout(done, EXPAND_MS));

		// Stage two: the layout cross-fades this view into the game page.
		requestReveal();
		await goto(href);
	}
```

- [ ] **Step 2: Wrap that one navigation in a view transition**

Replace the `<script>` block of `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import './layout.css';
	import { onNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import SubmitDialog from '$lib/components/SubmitDialog.svelte';
	import { takeReveal } from '$lib/game';

	let { children, data } = $props();

	/* Only the chooser asks for this; every other navigation is left alone. The attribute scopes
	   the pseudo-element rules in layout.css to this transition, as the theme reveal does. */
	onNavigate((navigation) => {
		if (!takeReveal() || typeof document.startViewTransition !== 'function') return;
		const el = document.documentElement;
		el.dataset.chooseTransition = '';
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			transition.finished.finally(() => {
				delete el.dataset.chooseTransition;
			});
		});
	});
</script>
```

The markup below the script block stays exactly as it is.

- [ ] **Step 3: Style the cross-fade**

In `src/routes/layout.css`, directly after the `html[data-theme-transition]::view-transition-new(root) { z-index: 9999; }` rule and before the reduced-motion block, add:

```css
	/* Chooser to game page only. The default cross-fade, slowed to match the panel expansion
	   that precedes it, and without the plus-lighter blend that washes dark art out. */
	html[data-choose-transition]::view-transition-old(root),
	html[data-choose-transition]::view-transition-new(root) {
		animation-duration: 350ms;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		mix-blend-mode: normal;
	}
```

- [ ] **Step 4: Add the e2e tests**

Append to `e2e/site.e2e.ts`:

```ts
test('the pick animates, then cleans up the transition attribute', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile tools/ }).click();
	await expect(page.locator('.chooser')).toHaveAttribute('data-expanding', 'poe1');
	await expect(page).toHaveURL(/\/poe1$/);
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile');
	// The scoping attribute must be cleaned up, or the rules leak into later transitions.
	await expect(page.locator('html')).not.toHaveAttribute('data-choose-transition', /.*/);
});

test('reduced motion skips straight to the game page', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile 2 tools/ }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await expect(page.locator('html')).not.toHaveAttribute('data-choose-transition', /.*/);
});
```

- [ ] **Step 5: Build and run the e2e suite**

Run: `bun run test:e2e`
Expected: every test passes, including the two new ones. If `data-expanding` is asserted too late to be seen (the navigation already happened), the first assertion may flake; in that case assert it inside a `page.waitForFunction` with a 300ms budget rather than removing it.

- [ ] **Step 6: Look at it**

Run: `bun run preview`, open `http://localhost:4173/?choose`, click a half. Expected: the half grows to fill the viewport over about half a second, the headline and the other half fade, then the game page fades in. Click the brand on the game page: it goes to `/`, which redirects back to the same game page. "Switch game" shows the chooser again. Stop the preview.

- [ ] **Step 7: Format, lint, check, commit**

```bash
bun run format && bun run lint && bun run check
git add src/routes/+page.svelte src/routes/+layout.svelte src/routes/layout.css e2e/site.e2e.ts
git commit -m "Animate the chosen half open into the game page"
```

---

## Self-review notes

- Spec coverage: routes (T3, T4), memory and redirect (T2, T4), chooser layout and hover (T4), always-dark (T4 step 1), art (T4 step 2), transition (T5), per-game page sections including TopBar context and search (T3), helpers (T1), OG cards (T3), tests (each task), old e2e tests moved (T4 step 7).
- The `Select` word and the dot are hidden below `md`, matching the mobile artboard, which shows only the arrow and the count.
- `GamePanel` reads `hovered`/`expanding` as props and reports through callbacks; the page owns all state, so the two halves never disagree.
