<script lang="ts">
	import { resolve } from '$app/paths';
	import Meta from '$lib/components/Meta.svelte';
	import HeroOcean from '$lib/components/HeroOcean.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { submitDialog } from '$lib/submit.svelte';

	let { data } = $props();
</script>

<!-- No brand suffix: at 58 characters this already fills a search result, and og:site_name
     carries the brand into social cards. -->
<Meta
	title="Curated directory of Path of Exile 1 & 2 third-party tools"
	description="A curated directory of {data.total} third-party tools for Path of Exile 1 and 2. Every listing says what platform it runs on, what it costs, and whether the source is open."
	image="home.png"
	path="/"
/>

<TopBar compact />

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
				<h1 class="text-[36px] leading-[1.05] font-medium tracking-tight text-ink sm:text-[48px]">
					Third-party tools for Path&nbsp;of&nbsp;Exile 1&nbsp;&amp;&nbsp;2
				</h1>
				<p class="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
					A directory of {data.total} community tools for Path of Exile 1 and 2. Every listing says what
					platform it runs on, what it costs, and whether the source is open.
				</p>
				<div class="mt-8 flex flex-wrap gap-2.5">
					<a
						href={resolve('/tools')}
						class="inline-flex h-9 items-center rounded-md bg-accent-fill px-4 text-[13.5px] font-medium text-accent-on-fill transition-opacity duration-100 hover:opacity-90"
					>
						Browse tools
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
								href="{resolve('/tools')}?cat={category.id}"
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
