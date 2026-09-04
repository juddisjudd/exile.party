<script lang="ts">
	import { resolve } from '$app/paths';
	import { isStale } from '$lib/catalog/filter';

	let { data } = $props();

	const byCategory = $derived(
		data.catalog.categories
			.map((c) => ({ ...c, tools: data.catalog.tools.filter((t) => t.category === c.id) }))
			.filter((c) => c.tools.length > 0)
	);
</script>

<svelte:head>
	<title>PoE Tool List</title>
</svelte:head>

<main>
	<h1>Path of Exile tools</h1>
	<p>{data.catalog.tools.length} third-party tools for Path of Exile 1 and 2.</p>

	{#each byCategory as category (category.id)}
		<section>
			<h2>{category.name}</h2>
			{#if category.description}
				<p>{category.description}</p>
			{/if}
			<ul>
				{#each category.tools as tool (tool.id)}
					<li>
						<a href={resolve('/tools/[id]', { id: tool.id })}>{tool.name}</a>
						[{tool.games.join(', ')}]
						{#if isStale(tool.lastVerified, data.builtAt)}(stale){/if}
						<br />
						{tool.description}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</main>
