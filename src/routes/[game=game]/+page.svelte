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

<!-- Keyed on the game: the route is shared, so a param change must remount, not update. -->
{#key data.game}
	<ToolDirectory catalog={data.catalog} lock={data.game} />
{/key}
