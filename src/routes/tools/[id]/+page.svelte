<script lang="ts">
	import { resolve } from '$app/paths';
	import { isStale } from '$lib/catalog/filter';

	let { data } = $props();
	const { tool, category } = $derived(data);
	const stale = $derived(isStale(tool.lastVerified, data.builtAt));
</script>

<svelte:head>
	<title>{tool.name} · PoE Tool List</title>
</svelte:head>

<main>
	<a href={resolve('/')}>All tools</a>
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
