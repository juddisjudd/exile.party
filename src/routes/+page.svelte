<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Game } from '$lib/catalog/schema';
	import GamePanel from '$lib/components/GamePanel.svelte';
	import Mark from '$lib/components/Mark.svelte';
	import Meta from '$lib/components/Meta.svelte';
	import { gameStore, rememberGame } from '$lib/game';
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';

	let { data } = $props();

	/* Seam geometry, desktop: from 54% at the top to 46% at the bottom, shifting 8% away from
	   the hovered half. Mobile geometry lives in GamePanel's stylesheet. */
	const SEAM_TOP = 54;
	const SEAM_BOTTOM = 46;
	const SHIFT = 8;

	// The length of the outro below.
	const EXIT_MS = 900;

	let hovered = $state<Game | null>(null);
	let picked = $state<Game | null>(null);

	const shift = $derived(hovered === 'poe2' ? -SHIFT : hovered === 'poe1' ? SHIFT : 0);
	const seamTop = $derived(SEAM_TOP + shift);
	const seamBottom = $derived(SEAM_BOTTOM + shift);

	/* Touch fires pointerenter on tap; only real pointers get the hover move. */
	const canHover = browser && matchMedia('(hover: hover)').matches;

	function hover(game: Game | null) {
		if (canHover && picked === null) hovered = game;
	}

	async function pick(game: Game, href: string) {
		if (picked !== null) return;
		picked = game;
		rememberGame(game, gameStore());
		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- href comes from GamePanel's resolve() call; the rule cannot see through the onpick prop boundary
			await goto(href, { replaceState: true });
		} catch {
			// A failed navigation hands the chooser back rather than leaving it half picked.
			picked = null;
		}
	}

	/* Plays as SvelteKit removes the page: the root is pinned over the new page and --exit runs
	   0 to 1, which the stylesheet turns into the picked half opening and everything else fading. */
	function exit(node: HTMLElement): TransitionConfig {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (picked === null || still) return { duration: 0 };
		return {
			duration: EXIT_MS,
			easing: cubicOut,
			tick: (_t, u) => node.style.setProperty('--exit', String(u))
		};
	}
</script>

<!-- No brand suffix: at 58 characters this already fills a search result, and og:site_name
     carries the brand into social cards. -->
<Meta
	title="Curated directory of Path of Exile 1 & 2 third-party tools"
	description="A curated directory of {data.total} third-party tools for Path of Exile 1 and 2. Pick your game, then browse by category, platform, price, and whether the source is open."
	image="home.png"
	path="/"
/>

<div
	class="chooser relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink"
	data-force-theme="dark"
	data-picked={picked ?? undefined}
	style:--seam-top="{seamTop}%"
	style:--seam-bottom="{seamBottom}%"
	out:exit|global
>
	<!-- On desktop the band floats over the art; only its link takes pointer events. -->
	<div class="band pointer-events-none relative z-10 md:absolute md:inset-x-0 md:top-0">
		<header class="flex h-14 items-center justify-between px-5 md:px-8">
			<span class="flex items-center gap-2 text-[15px] font-medium tracking-tight text-ink">
				<Mark />
				<span>exile<span class="text-faint">.</span>party</span>
			</span>
			<a
				href={resolve('/tools')}
				class="pointer-events-auto hidden items-center gap-1.5 text-[13px] text-muted transition-colors duration-100 hover:text-ink md:flex"
			>
				Browse all tools
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					aria-hidden="true"
					class="size-3.5"
				>
					<path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</a>
		</header>
		<div
			class="flex flex-col items-center gap-2.5 px-5 pt-5 pb-8 text-center md:gap-3.5 md:pt-[112px] md:pb-0"
		>
			<h1
				class="text-[34px] leading-[1.08] font-medium tracking-tight text-ink [text-shadow:0_2px_28px_rgb(0_0_0/0.55)] md:text-[58px] md:leading-[1.05]"
			>
				Welcome to the Party, Exile
			</h1>
			<p class="text-[15px] leading-normal text-muted md:text-[17px]">
				Explore tools for Path of Exile
			</p>
			<p
				class="mt-2 flex items-center gap-3 text-[10.5px] tracking-[0.09em] text-faint uppercase md:mt-4 md:gap-3.5 md:text-[11px]"
			>
				<span class="h-px w-7 bg-line-strong md:w-10" aria-hidden="true"></span>
				Choose your game
				<span class="h-px w-7 bg-line-strong md:w-10" aria-hidden="true"></span>
			</p>
		</div>
	</div>

	<div class="relative min-h-[560px] flex-1 md:absolute md:inset-0 md:min-h-0">
		<GamePanel
			game="poe1"
			count={data.counts.poe1}
			{hovered}
			{picked}
			onhover={hover}
			onpick={pick}
		/>
		<GamePanel
			game="poe2"
			count={data.counts.poe2}
			{hovered}
			{picked}
			onhover={hover}
			onpick={pick}
		/>

		<div class="seam pointer-events-none absolute inset-0" aria-hidden="true"></div>

		<div
			class="glow pointer-events-none absolute left-1/2 hidden md:block"
			aria-hidden="true"
		></div>
	</div>

	<p
		class="credit pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[11px] text-faint md:bottom-4"
	>
		Artwork by Grinding Gear Games. Not affiliated with GGG.
	</p>
</div>

<style>
	@reference './layout.css';

	/* The root floats over the new page from the moment a half is picked; --exit is still 0
	   until the outro runs, so nothing changes visually until then. */
	.chooser[data-picked] {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		opacity: clamp(0, 1 - (var(--exit, 0) - 0.3) / 0.7, 1);
	}
	.chooser[data-picked] :is(.band, .seam, .credit, .glow) {
		opacity: calc(1 - min(1, var(--exit, 0) * 2));
	}

	/* One-pixel hairline clipped out of a full-size box, so it slides with the panels. */
	.seam {
		background: var(--line-strong);
		clip-path: polygon(
			0 calc(52% - 0.5px),
			100% calc(48% - 0.5px),
			100% calc(48% + 0.5px),
			0 calc(52% + 0.5px)
		);
		transition: clip-path 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	@variant md {
		.seam {
			clip-path: polygon(
				calc(var(--seam-top) - 0.5px) 0,
				calc(var(--seam-top) + 0.5px) 0,
				calc(var(--seam-bottom) + 0.5px) 100%,
				calc(var(--seam-bottom) - 0.5px) 100%
			);
		}
	}

	/* Darkens the art behind the headline block. */
	.glow {
		top: 130px;
		width: 980px;
		height: 460px;
		transform: translateX(-50%);
		background: radial-gradient(
			ellipse at center,
			rgb(20 22 25 / 0.78) 0%,
			rgb(20 22 25 / 0.42) 46%,
			rgb(20 22 25 / 0) 72%
		);
	}
</style>
