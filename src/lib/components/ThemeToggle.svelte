<script lang="ts">
	import { theme, type ThemeChoice } from '$lib/theme.svelte';

	const options: { value: ThemeChoice; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'system', label: 'System' },
		{ value: 'dark', label: 'Dark' }
	];

	/* Reveal starts at the button, not the pointer, so keyboard activation lands in the same place. */
	function choose(value: ThemeChoice, event: MouseEvent) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		theme.set(value, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
	}
</script>

<div
	class="flex items-center gap-0.5 rounded-md border border-line bg-raised/60 p-0.5"
	role="group"
	aria-label="Colour theme"
>
	{#each options as option (option.value)}
		<button
			type="button"
			class="opt opt-{option.value} flex size-6 items-center justify-center rounded-[4px] border border-transparent text-faint transition-colors duration-100 hover:text-ink"
			title={option.label}
			aria-label={option.label}
			aria-pressed={theme.choice === option.value}
			onclick={(event) => choose(option.value, event)}
		>
			{#if option.value === 'light'}
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.3"
					class="size-4"
				>
					<circle cx="8" cy="8" r="3" />
					<path
						d="M8 1.5v1.2M8 13.3v1.2M14.5 8h-1.2M2.7 8H1.5M12.6 3.4l-.85.85M4.25 11.75l-.85.85M12.6 12.6l-.85-.85M4.25 4.25l-.85-.85"
						stroke-linecap="round"
					/>
				</svg>
			{:else if option.value === 'system'}
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.3"
					class="size-4"
				>
					<rect x="2" y="3" width="12" height="8" rx="1.2" />
					<path d="M6 13.5h4" stroke-linecap="round" />
				</svg>
			{:else}
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.3"
					class="size-4"
				>
					<path
						d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</button>
	{/each}
</div>

<style>
	/* Driven by the attribute the inline script in app.html sets, so the correct
	   segment is lit on first paint rather than after hydration. */
	:global(html[data-theme-choice='light']) .opt-light,
	:global(html[data-theme-choice='system']) .opt-system,
	:global(html[data-theme-choice='dark']) .opt-dark {
		background-color: var(--surface);
		border-color: var(--line);
		color: var(--ink);
	}
</style>
