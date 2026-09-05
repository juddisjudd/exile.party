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
				<path
					d="M3 5.5h9l-2.5-2.5M13 10.5H4l2.5 2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
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
