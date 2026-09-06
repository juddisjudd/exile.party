<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import ScrollDots from '$lib/components/ScrollDots.svelte';
	import ToolCard from '$lib/components/ToolCard.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { GAME_NAME, PRICING_LABEL } from '$lib/catalog/display';
	import {
		EMPTY_FILTERS,
		activeChipCount,
		filterTools,
		fromSearchParams,
		isStale,
		toSearchParams,
		type Code,
		type Filters,
		type Origin
	} from '$lib/catalog/filter';
	import type { Catalog, Game, Pricing } from '$lib/catalog/schema';

	import { submitDialog } from '$lib/submit.svelte';

	interface Props {
		catalog: Catalog;
		builtAt: string;
		/** Fixes the game to a route, e.g. `/poe1`. Unset on `/tools`, where the toggle picks it. */
		lock?: Game;
	}

	let { catalog, builtAt, lock }: Props = $props();

	const categoryIds = $derived(catalog.categories.map((c) => c.id));
	const pricings: Pricing[] = ['free', 'freemium', 'paid'];
	const origins: Origin[] = ['official', 'community'];
	const codes: Code[] = ['open', 'closed'];

	/** The pool this page can ever show: the whole catalog, or one game's slice when locked. */
	const pool = $derived(lock ? catalog.tools.filter((t) => t.games.includes(lock)) : catalog.tools);

	/** Nothing official is listed yet, so the filter would only offer an empty set. */
	const hasOfficial = $derived(pool.some((t) => t.official));

	// svelte-ignore state_referenced_locally (lock is fixed for the life of the component: the game page keys on it.)
	let filters = $state<Filters>({ ...EMPTY_FILTERS, game: lock ?? null });
	let synced = $state(false);

	// The page is prerendered without a querystring, so filters are read on the client.
	onMount(() => {
		const next = fromSearchParams(new URL(location.href).searchParams, categoryIds);
		filters = lock ? { ...next, game: lock } : next;
		synced = true;
	});

	$effect(() => {
		const qs = toSearchParams(lock ? { ...filters, game: null } : filters).toString();
		if (!synced || location.search.replace(/^\?/, '') === qs) return;
		const here = lock ? resolve('/[game=game]', { game: lock }) : resolve('/tools');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation
		replaceState(qs ? `${here}?${qs}` : here, {});
	});

	const categoryOrder = $derived(new Map(catalog.categories.map((c, i) => [c.id, i])));

	/* Sorted by category, then by name within each one. */
	const visible = $derived(
		filterTools(catalog.tools, filters).sort(
			(a, b) =>
				(categoryOrder.get(a.category) ?? 99) - (categoryOrder.get(b.category) ?? 99) ||
				a.name.localeCompare(b.name)
		)
	);
	const chips = $derived(activeChipCount(filters));

	const groups = $derived(
		catalog.categories
			.map((c) => ({ ...c, tools: visible.filter((t) => t.category === c.id) }))
			.filter((g) => g.tools.length > 0)
	);

	const steps = $derived(groups.map((g) => ({ id: `cat-${g.id}`, label: g.name })));

	/** Count a chip would yield if selected, honouring every other active filter. */
	function countFor(over: Partial<Filters>): number {
		return filterTools(catalog.tools, { ...filters, ...over }).length;
	}

	function clear() {
		filters = { ...EMPTY_FILTERS, game: filters.game };
	}
</script>

{#if lock}
	<TopBar context={lock} bind:query={filters.query} />
{:else}
	<TopBar bind:game={filters.game} bind:query={filters.query} />
{/if}

<ScrollDots {steps} />

<main class="mx-auto w-full max-w-[1180px] flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
	<div class="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_232px]">
		<div class="min-w-0">
			<h1 class="text-[22px] leading-tight font-medium tracking-tight text-ink">
				{lock ? `${GAME_NAME[lock]} tools` : 'All tools'}
			</h1>

			<!-- Filters -->
			<div
				class="-mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
			>
				<Chip active={filters.category === null} onselect={() => (filters.category = null)}>
					All
				</Chip>
				{#each catalog.categories as category (category.id)}
					<Chip
						active={filters.category === category.id}
						onselect={() =>
							(filters.category = filters.category === category.id ? null : category.id)}
						count={countFor({ category: category.id })}
					>
						{category.name}
					</Chip>
				{/each}
			</div>

			<!-- Each label stays glued to its own chips when the row wraps. -->
			<div class="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
				<div class="flex items-center gap-1.5">
					<span class="mr-0.5 text-[11px] tracking-[0.08em] text-faint uppercase">Price</span>
					{#each pricings as pricing (pricing)}
						<Chip
							active={filters.pricing === pricing}
							onselect={() => (filters.pricing = filters.pricing === pricing ? null : pricing)}
							count={countFor({ pricing })}
						>
							{PRICING_LABEL[pricing]}
						</Chip>
					{/each}
				</div>

				<div class="flex items-center gap-1.5">
					<span class="mr-0.5 text-[11px] tracking-[0.08em] text-faint uppercase">Source</span>
					{#each codes as code (code)}
						<Chip
							active={filters.code === code}
							onselect={() => (filters.code = filters.code === code ? null : code)}
							count={countFor({ code })}
						>
							{code === 'open' ? 'Open' : 'Closed'}
						</Chip>
					{/each}
				</div>

				{#if hasOfficial}
					<div class="flex items-center gap-1.5">
						<span class="mr-0.5 text-[11px] tracking-[0.08em] text-faint uppercase">Author</span>
						{#each origins as origin (origin)}
							<Chip
								active={filters.origin === origin}
								onselect={() => (filters.origin = filters.origin === origin ? null : origin)}
								count={countFor({ origin })}
							>
								{origin === 'official' ? 'Official' : 'Community'}
							</Chip>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Result count -->
			<div class="mt-6 flex items-center justify-between border-t border-line pt-3">
				<p class="text-[12.5px] text-faint tabular-nums">
					{visible.length}
					{visible.length === 1 ? 'tool' : 'tools'}
					{#if visible.length !== pool.length}
						<span class="text-faint/70">of {pool.length}</span>
					{/if}
				</p>
				{#if chips > 0}
					<button
						type="button"
						onclick={clear}
						class="text-[12.5px] text-muted transition-colors duration-100 hover:text-ink"
					>
						Clear filters
					</button>
				{/if}
			</div>

			<!-- List -->
			{#if visible.length === 0}
				<div class="mt-10 rounded-lg border border-dashed border-line px-4 py-12 text-center">
					<p class="text-[14px] text-ink">No tools match these filters.</p>
					<button
						type="button"
						onclick={clear}
						class="mt-2 text-[13px] text-accent transition-colors duration-100"
					>
						Clear filters
					</button>
				</div>
			{:else}
				{#each groups as group (group.id)}
					<section id="cat-{group.id}" class="mt-9 scroll-mt-24 first:mt-6">
						<div class="mb-3 flex items-center gap-3">
							<h2 class="text-[11px] font-medium tracking-[0.09em] text-faint uppercase">
								{group.name}
							</h2>
							<span class="h-px flex-1 bg-line"></span>
							<span class="text-[11px] text-faint tabular-nums">{group.tools.length}</span>
						</div>
						<ul class="grid gap-3 sm:grid-cols-2">
							{#each group.tools as tool, i (tool.id)}
								<!-- An odd group would leave the last row half empty, so that card takes the width. -->
								<ToolCard
									{tool}
									wide={group.tools.length % 2 === 1 && i === group.tools.length - 1}
									stale={isStale(tool.lastVerified, builtAt)}
								/>
							{/each}
						</ul>
					</section>
				{/each}
			{/if}
		</div>

		<!-- Right rail -->
		<aside class="hidden lg:block">
			<div class="sticky top-20 space-y-6">
				<div>
					<h2 class="text-[12px] font-medium tracking-[0.04em] text-ink uppercase">
						Reading a listing
					</h2>
					<dl class="mt-3 space-y-2.5 text-[12.5px] leading-snug">
						<div>
							<dt class="text-ink">Editor&rsquo;s pick</dt>
							<dd class="text-faint">
								What we would hand a new player first. Chosen by whoever maintains the list.
							</dd>
						</div>
						<div>
							<dt class="text-ink">Open source</dt>
							<dd class="text-faint">
								The code is public and the card links to it. Plenty of good tools are closed source.
							</dd>
						</div>
						<div>
							<dt class="text-ink">Made by a maintainer</dt>
							<dd class="text-faint">
								Someone who works on
								<a href={resolve('/maintainers')} class="text-accent transition-colors duration-100"
									>this site</a
								> built it. The card says so.
							</dd>
						</div>
						<div>
							<dt class="text-ink">Unmaintained &middot; Dead</dt>
							<dd class="text-faint">The tool itself has stopped being updated.</dd>
						</div>
						<div>
							<dt class="text-ink">Stale</dt>
							<dd class="text-faint">Nobody has re-checked this listing in six months.</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-lg border border-line p-4">
					<h2 class="text-[13px] font-medium text-ink">Missing a tool?</h2>
					<p class="mt-1.5 text-[12.5px] leading-snug text-faint">
						The catalogue is a single YAML file. Open an issue or send a pull request.
					</p>
					<button
						type="button"
						onclick={() => submitDialog.show()}
						class="mt-3 inline-flex h-8 items-center rounded-md bg-accent-fill px-3 text-[12.5px] font-medium text-accent-on-fill transition-opacity duration-100 hover:opacity-90"
					>
						Submit a tool
					</button>
				</div>
			</div>
		</aside>
	</div>
</main>

<SiteFooter />
