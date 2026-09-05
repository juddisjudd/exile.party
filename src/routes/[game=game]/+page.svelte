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
					<a
						href={/* eslint-disable-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation */ directory}
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
							<a
								href="{/* eslint-disable-line svelte/no-navigation-without-resolve -- path comes from resolve(); the rule cannot see through the query concatenation */ directory}&cat={category.id}"
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
