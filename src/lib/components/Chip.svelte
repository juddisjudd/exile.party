<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		active: boolean;
		onselect: () => void;
		count?: number;
		children: Snippet;
	}

	let { active, onselect, count, children }: Props = $props();

	/** A chip that would return nothing is shown, so the gap is visible, but not offered. */
	const empty = $derived(!active && count === 0);
</script>

<button
	type="button"
	aria-pressed={active}
	disabled={empty}
	onclick={onselect}
	class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] whitespace-nowrap transition-colors duration-100
		{active
		? 'border-accent-line bg-accent-tint text-accent'
		: empty
			? 'cursor-default border-line text-faint/45'
			: 'border-line text-muted hover:border-line-strong hover:bg-surface-hover hover:text-ink'}"
>
	{@render children()}
	{#if count !== undefined}
		<span class="text-[11px] tabular-nums {active ? 'opacity-70' : 'text-faint'}">{count}</span>
	{/if}
</button>
