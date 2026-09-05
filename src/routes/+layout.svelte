<script lang="ts">
	import './layout.css';
	import { beforeNavigate, goto, onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import SubmitDialog from '$lib/components/SubmitDialog.svelte';
	import { readGame, takeReveal } from '$lib/game';

	let { children, data } = $props();

	/* A remembered game skips the chooser on client-side navigation too; the inline script in
	   app.html only sees full loads. `?choose` is the way back in, exactly as on a full load. */
	beforeNavigate((navigation) => {
		if (navigation.to?.route.id !== '/' || navigation.to.url.searchParams.has('choose')) return;
		const game = readGame(localStorage);
		if (game === null) return;
		navigation.cancel();
		goto(resolve('/[game=game]', { game }), { replaceState: true });
	});

	/* Only the chooser asks for this; every other navigation is left alone. The attribute scopes
	   the pseudo-element rules in layout.css to this transition, as the theme reveal does. */
	onNavigate((navigation) => {
		if (!takeReveal() || typeof document.startViewTransition !== 'function') return;
		const el = document.documentElement;
		el.dataset.chooseTransition = '';
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				// transition.finished still runs and removes the attribute even if navigation fails.
				await navigation.complete.catch(() => {});
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
