<script lang="ts">
	import { resolve } from '$app/paths';
	import Meta from '$lib/components/Meta.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { isStale } from '$lib/catalog/filter';

	let { data } = $props();
	const { tool, category } = $derived(data);
	const stale = $derived(isStale(tool.lastVerified, data.builtAt));
</script>

<Meta
	title="{tool.name} · exile.party"
	description={tool.description}
	image="tool-{tool.id}.png"
	path="/tools/{tool.id}"
/>

<TopBar compact />

<main class="mx-auto w-full max-w-[1180px] flex-1 px-4 py-10 sm:px-6">
	<a
		href={resolve('/tools')}
		class="text-[13px] text-muted transition-colors duration-100 hover:text-ink">&larr; All tools</a
	>
	<h1>{tool.name}</h1>
	<p>{tool.description}</p>

	<dl>
		<dt>Website</dt>
		<dd><a href={tool.url} rel="external noopener">{tool.url}</a></dd>
		{#if tool.urls}
			{#each Object.entries(tool.urls) as [game, url] (game)}
				<dt>{game} site</dt>
				<dd><a href={url} rel="external noopener">{url}</a></dd>
			{/each}
		{/if}
		<dt>Category</dt>
		<dd>{category.name}</dd>
		<dt>Games</dt>
		<dd>{tool.games.join(', ')}</dd>
		<dt>Platforms</dt>
		<dd>{tool.platforms.join(', ')}</dd>
		<dt>Pricing</dt>
		<dd>{tool.pricing}</dd>
		{#if tool.source}
			<dt>Source</dt>
			<dd><a href={tool.source} rel="external noopener">{tool.source}</a></dd>
		{/if}
		<dt>Status</dt>
		<dd>{tool.status}</dd>
		<dt>Last verified</dt>
		<dd>
			<time datetime={tool.lastVerified}>{tool.lastVerified}</time>
			{#if stale}(stale){/if}
		</dd>
		{#if tool.tags.length}
			<dt>Tags</dt>
			<dd>{tool.tags.join(', ')}</dd>
		{/if}
	</dl>

	{#if tool.notes}
		<p>{tool.notes}</p>
	{/if}
</main>

<SiteFooter />
