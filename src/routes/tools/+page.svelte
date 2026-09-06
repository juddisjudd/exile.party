<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import ToolDirectory from '$lib/components/ToolDirectory.svelte';

	let { data } = $props();
</script>

<Meta
	title="Tools · exile.party"
	description="Browse third-party Path of Exile 1 and 2 tools by category, platform, price, and whether the source is open."
	image="tools.png"
	path="/tools"
/>

<ToolDirectory catalog={data.catalog} builtAt={data.builtAt} />
