<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import SubmitDialog from '$lib/components/SubmitDialog.svelte';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Column so a short page still pushes the footer to the bottom of the viewport. -->
<div class="flex min-h-dvh flex-col">
	{@render children()}
</div>

<SubmitDialog categoryIds={data.categoryIds} />
