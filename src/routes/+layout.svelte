<script lang="ts">
	import './layout.css';
	import { onNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import SubmitDialog from '$lib/components/SubmitDialog.svelte';
	import { takeReveal } from '$lib/game';

	let { children, data } = $props();

	/* Only the chooser asks for this; every other navigation is left alone. The attribute scopes
	   the pseudo-element rules in layout.css to this transition, as the theme reveal does. */
	onNavigate((navigation) => {
		if (!takeReveal() || typeof document.startViewTransition !== 'function') return;
		const el = document.documentElement;
		el.dataset.chooseTransition = '';
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			transition.finished.finally(() => {
				delete el.dataset.chooseTransition;
			});
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Column so a short page still pushes the footer to the bottom of the viewport. -->
<div class="flex min-h-dvh flex-col">
	{@render children()}
</div>

<SubmitDialog categoryIds={data.categoryIds} />
