<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { GAME_LABEL } from '$lib/catalog/display';
	import type { Game } from '$lib/catalog/schema';
	import Mark from './Mark.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		/** Omitted outside the directory, where there is nothing to filter. */
		game?: Game | null;
		compact?: boolean;
		/** On a per-game page: names the game and offers the way back to the chooser. */
		context?: Game;
		/** Opens the search palette. Absent on pages without one. */
		onsearch?: () => void;
	}

	let { game = $bindable(null), compact = false, context, onsearch }: Props = $props();

	/** What the palette will actually search: the route's game, else whatever the toggle says. */
	const scope = $derived(context ?? game);

	const games: { value: Game | null; label: string }[] = [
		{ value: null, label: 'All' },
		{ value: 'poe1', label: 'PoE 1' },
		{ value: 'poe2', label: 'PoE 2' }
	];

	/* Rendered as "Ctrl K" on the server and swapped after mount, so the HTML never guesses. */
	let mac = $state(false);
	onMount(() => {
		mac = /Mac|iPhone|iPad/.test(navigator.platform);
	});
</script>

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

{#snippet searchButton(extra: string)}
	<button
		type="button"
		onclick={onsearch}
		class="flex h-8 min-w-0 items-center gap-2 rounded-md border border-line bg-surface pr-2 pl-2.5 text-[13px] text-faint transition-colors duration-100 hover:border-line-strong hover:text-muted {extra}"
	>
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.3"
			aria-hidden="true"
			class="size-3.5 shrink-0"
		>
			<circle cx="7" cy="7" r="4.5" />
			<path d="m10.5 10.5 3 3" stroke-linecap="round" />
		</svg>
		<span class="min-w-0 flex-1 truncate text-left">
			{scope ? `Search ${GAME_LABEL[scope]} tools` : 'Search tools'}
		</span>
		<kbd class="rounded border border-line px-1 font-sans text-[10px] text-faint">
			{mac ? '⌘' : 'Ctrl'} K
		</kbd>
	</button>
{/snippet}

<header class="sticky top-0 z-40 border-b border-line bg-canvas">
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6">
		<div class="flex h-14 items-center gap-4">
			<a
				href={resolve('/')}
				class="flex shrink-0 items-center gap-2 text-[15px] font-medium tracking-tight text-ink"
				aria-label="exile.party home"
			>
				<Mark />
				<span>exile<span class="text-faint">.</span>party</span>
			</a>

			{#if context}
				<div class="hidden md:block">{@render contextPill(context)}</div>
			{:else if !compact}
				<div class="hidden md:block">{@render gameToggle()}</div>
			{/if}

			<div class="ml-auto flex items-center gap-3">
				{#if !compact}
					{@render searchButton('hidden w-56 md:flex lg:w-72')}
				{/if}
				<ThemeToggle />
			</div>
		</div>

		{#if !compact}
			<div class="flex items-center gap-3 pb-3 md:hidden">
				{@render searchButton('flex-1')}
				{#if context}
					{@render contextPill(context)}
				{:else}
					{@render gameToggle()}
				{/if}
			</div>
		{/if}
	</div>
</header>
