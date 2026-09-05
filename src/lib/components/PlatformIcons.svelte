<script lang="ts">
	import { PLATFORM_LABEL } from '$lib/catalog/display';
	import type { Platform } from '$lib/catalog/schema';

	interface Props {
		platforms: readonly Platform[];
	}

	let { platforms }: Props = $props();

	const drawn: Platform[] = ['windows', 'linux', 'macos', 'web'];
	const icons = $derived(platforms.filter((p) => drawn.includes(p)));
	const rest = $derived(platforms.filter((p) => !drawn.includes(p)));
</script>

<span class="inline-flex items-center gap-1.5 text-faint">
	{#each icons as platform (platform)}
		<span title={PLATFORM_LABEL[platform]} class="inline-flex">
			<span class="sr-only">{PLATFORM_LABEL[platform]}</span>
			{#if platform === 'windows'}
				<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5" fill="currentColor">
					<path
						d="M1.6 3.1 7.3 2.3v5.2H1.6Zm0 9.8 5.7.8V8.5H1.6ZM8.1 2.2l6.3-.9v6.2H8.1Zm0 6.3h6.3v6.2l-6.3-.9Z"
					/>
				</svg>
			{:else if platform === 'linux'}
				<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5" fill="currentColor">
					<path
						d="M8 1c1.7 0 2.7 1.3 2.7 3 0 .6-.1 1-.1 1.4 0 .9 1.2 2.2 1.7 3.4.4 1 .7 2 .7 2.8 0 1.9-1.6 3.1-5 3.1s-5-1.2-5-3.1c0-.8.3-1.8.7-2.8.5-1.2 1.7-2.5 1.7-3.4 0-.4-.1-.8-.1-1.4C5.3 2.3 6.3 1 8 1Zm-1.2 3a.7.8 0 1 0 0 1.6.7.8 0 0 0 0-1.6Zm2.4 0a.7.8 0 1 0 0 1.6.7.8 0 0 0 0-1.6ZM8 5.9 6.9 6.7 8 7.5l1.1-.8Z"
					/>
				</svg>
			{:else if platform === 'macos'}
				<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5" fill="currentColor">
					<path
						d="M10.9 8.5c0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.2-2.2-1.2-.9-.1-1.8.6-2.3.6s-1.2-.5-2-.5c-1 0-2 .6-2.5 1.6-1.1 1.9-.3 4.6.8 6.1.5.7 1.1 1.5 1.9 1.5.8 0 1-.5 2-.5s1.2.5 2 .5 1.3-.7 1.8-1.4c.6-.8.8-1.6.8-1.6s-1.6-.6-1.6-2.8ZM9.5 3.9c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.5-.7 1.2-.6 1.9.7.1 1.4-.3 1.8-.9Z"
					/>
				</svg>
			{:else}
				<svg
					viewBox="0 0 16 16"
					aria-hidden="true"
					class="size-3.5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.2"
				>
					<circle cx="8" cy="8" r="6" />
					<ellipse cx="8" cy="8" rx="2.6" ry="6" />
					<path d="M2.3 6h11.4M2.3 10h11.4" />
				</svg>
			{/if}
		</span>
	{/each}
	{#each rest as platform (platform)}
		<span class="text-[11.5px]">{PLATFORM_LABEL[platform]}</span>
	{/each}
</span>
