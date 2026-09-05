<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		GAME_LABEL,
		PRICING_LABEL,
		STATUS_LABEL,
		displayHost,
		monogram,
		repoLinks,
		siteLinks
	} from '$lib/catalog/display';
	import type { Tool } from '$lib/catalog/schema';
	import PlatformIcons from './PlatformIcons.svelte';

	interface Props {
		tool: Tool;
		stale: boolean;
		/** Spans both columns, so an odd-sized category never leaves a hole in the grid. */
		wide?: boolean;
	}

	let { tool, stale, wide = false }: Props = $props();

	const sites = $derived(siteLinks(tool));
	const repos = $derived(repoLinks(tool));
</script>

{#snippet outbound(label: string, url: string, strong = false)}
	<a
		href={url}
		rel="external noopener"
		class="relative z-10 inline-flex items-center gap-1 transition-colors duration-100 hover:text-accent
			{strong ? 'text-muted' : 'text-faint'}"
	>
		{label}
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.4"
			aria-hidden="true"
			class="size-3 shrink-0"
		>
			<path d="M6 3.5h6.5V10" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M12.5 3.5 4 12" stroke-linecap="round" />
		</svg>
	</a>
{/snippet}

<li
	class="group relative flex flex-col rounded-lg border border-line bg-surface transition-colors duration-100 focus-within:border-line-strong hover:border-line-strong {wide
		? 'sm:col-span-2'
		: ''}"
>
	<div class="flex flex-1 flex-col gap-3 p-4">
		<div class="flex items-start gap-3">
			<span
				aria-hidden="true"
				class="grid size-9 shrink-0 place-items-center rounded-md border border-line text-[15px] font-medium text-muted transition-colors duration-100 group-hover:border-line-strong group-hover:text-ink"
			>
				{monogram(tool.name)}
			</span>

			<div class="min-w-0 flex-1">
				<div class="flex items-start justify-between gap-2">
					<a
						href={resolve('/tools/[id]', { id: tool.id })}
						class="text-[15px] leading-tight font-medium tracking-tight text-ink after:absolute after:inset-0"
					>
						{tool.name}
					</a>
					{#if tool.editorsPick}
						<span
							class="shrink-0 rounded border border-accent-line bg-accent-tint px-1.5 py-px text-[10.5px] leading-4 whitespace-nowrap text-accent"
						>
							Editor&rsquo;s pick
						</span>
					{/if}
				</div>

				<div class="mt-1.5 flex flex-wrap items-center gap-1">
					{#each tool.games as game (game)}
						<span class="rounded border border-line px-1 py-px text-[10.5px] leading-4 text-faint">
							{GAME_LABEL[game]}
						</span>
					{/each}
					{#if tool.official}
						<span
							class="rounded border border-accent-line bg-accent-tint px-1 py-px text-[10.5px] leading-4 text-accent"
						>
							Official
						</span>
					{/if}
					{#if tool.status !== 'active'}
						<span
							class="rounded border px-1 py-px text-[10.5px] leading-4 text-faint {tool.status ===
							'dead'
								? 'border-line-strong text-ink'
								: 'border-line'}"
						>
							{STATUS_LABEL[tool.status]}
						</span>
					{/if}
					{#if stale}
						<span
							class="rounded border border-dashed border-line px-1 py-px text-[10.5px] leading-4 text-faint"
							title="No one has re-checked this listing recently"
						>
							Stale
						</span>
					{/if}
				</div>
			</div>
		</div>

		<p class="text-[13.5px] leading-snug text-muted">{tool.description}</p>

		{#if tool.byMaintainer}
			<p class="text-[11.5px] leading-4 text-faint italic">
				Disclaimer: made by a maintainer of this site.
			</p>
		{/if}

		<div class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-faint">
			<PlatformIcons platforms={tool.platforms} />
			<span class="h-3 w-px bg-line"></span>
			<span>{PRICING_LABEL[tool.pricing]}</span>
			<span class="h-3 w-px bg-line"></span>
			<span class={tool.openSource ? 'text-muted' : ''}>
				{tool.openSource ? 'Open source' : 'Closed source'}
			</span>
		</div>
	</div>

	<div
		class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[12px]"
	>
		{#if sites.length === 1}
			{@render outbound(displayHost(sites[0].url), sites[0].url, true)}
		{:else}
			<span class="text-faint">{displayHost(tool.url)}</span>
			{#each sites as link (link.url)}
				{@render outbound(GAME_LABEL[link.game!], link.url, true)}
			{/each}
		{/if}

		{#if repos.length > 0}
			<span class="ml-auto flex items-center gap-3">
				{#each repos as link (link.url)}
					{@render outbound(link.game ? `Source ${GAME_LABEL[link.game]}` : 'Source', link.url)}
				{/each}
			</span>
		{/if}
	</div>
</li>
