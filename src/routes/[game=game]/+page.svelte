<script lang="ts">
	import { GAME_NAME } from '$lib/catalog/display';
	import Meta from '$lib/components/Meta.svelte';
	import ToolDirectory from '$lib/components/ToolDirectory.svelte';

	let { data } = $props();

	const name = $derived(GAME_NAME[data.game]);
</script>

<Meta
	title="{name} tools · exile.party"
	description="Browse third-party {name} tools by category, platform, price, and whether the source is open."
	image="{data.game}.png"
	path="/{data.game}"
/>

<ToolDirectory catalog={data.catalog} builtAt={data.builtAt} lock={data.game} />
