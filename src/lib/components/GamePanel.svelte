<script lang="ts">
	import { resolve } from '$app/paths';
	import poe1Jpg from '$lib/assets/chooser/poe1.jpg';
	import poe1Webp from '$lib/assets/chooser/poe1.webp';
	import poe2Jpg from '$lib/assets/chooser/poe2.jpg';
	import poe2Webp from '$lib/assets/chooser/poe2.webp';
	import { GAME_NAME } from '$lib/catalog/display';
	import type { Game } from '$lib/catalog/schema';

	interface Props {
		game: Game;
		count: number;
		/** The half the pointer or keyboard focus is on, if any. */
		hovered: Game | null;
		/** The half that has been picked and is opening into the exit, if any. */
		picked: Game | null;
		onhover: (game: Game | null) => void;
		onpick: (game: Game, href: string) => void;
	}

	let { game, count, hovered, picked, onhover, onpick }: Props = $props();

	const ART = {
		poe1: { jpg: poe1Jpg, webp: poe1Webp },
		poe2: { jpg: poe2Jpg, webp: poe2Webp }
	} as const;

	const side = $derived(game === 'poe1' ? 'left' : 'right');
	const href = $derived(resolve('/[game=game]', { game }));
	const hot = $derived(hovered === game);
	const dimmed = $derived(hovered !== null && hovered !== game);
	const isPicked = $derived(picked === game);
	const isOther = $derived(picked !== null && picked !== game);
</script>

<!-- A real link: works without JS, is focusable, and hover preloads the game page. -->
<a
	{href}
	class={[
		'panel absolute inset-0 block outline-none',
		side === 'left' ? 'panel-left' : 'panel-right'
	]}
	data-hot={hot ? '' : undefined}
	data-dimmed={dimmed ? '' : undefined}
	data-picked={isPicked ? '' : undefined}
	data-other={isOther ? '' : undefined}
	aria-label="{GAME_NAME[game]} tools, {count} listed"
	onpointerenter={() => onhover(game)}
	onpointerleave={() => onhover(null)}
	onfocus={() => onhover(game)}
	onblur={() => onhover(null)}
	onclick={(event) => {
		// Modifier clicks and non-primary buttons stay with the browser, as SvelteKit's own link handling does.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			return;
		event.preventDefault();
		onpick(game, href);
	}}
>
	<picture class="art pointer-events-none absolute">
		<source type="image/webp" srcset={ART[game].webp} />
		<img
			src={ART[game].jpg}
			alt=""
			class="size-full object-cover"
			style:object-position={side === 'left' ? '0% 50%' : '45% 50%'}
			loading="eager"
			fetchpriority="high"
			decoding="async"
		/>
	</picture>
	<div class="shade pointer-events-none absolute inset-0" aria-hidden="true"></div>
	<div
		class="label absolute bottom-9 flex max-w-[440px] flex-col gap-1.5 md:bottom-16 md:gap-2 {side ===
		'left'
			? 'left-5 items-start text-left md:left-16'
			: 'right-5 items-end text-right md:right-16'}"
	>
		<span
			class="text-[24px] leading-[1.1] font-medium tracking-tight text-ink [text-shadow:0_1px_12px_rgb(0_0_0/0.45)] md:text-[30px]"
		>
			{GAME_NAME[game]}
		</span>
		<span
			class="mt-1.5 flex items-center gap-3 text-[12.5px] text-muted md:mt-2 md:gap-3.5 md:text-[13px] {side ===
			'left'
				? ''
				: 'flex-row-reverse'}"
		>
			<span
				class="grid size-[30px] place-items-center rounded-full border border-line-strong bg-canvas/35 text-muted ring transition-colors duration-200 md:size-9"
				aria-hidden="true"
			>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					class="size-3.5"
				>
					<path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
			<span class="hidden md:inline">Select</span>
			<span class="hidden size-[3px] rounded-full bg-faint md:inline-block" aria-hidden="true"
			></span>
			<span class="text-faint tabular-nums">{count} tools</span>
		</span>
	</div>
</a>

<style>
	@reference '../../routes/layout.css';

	/* Mobile first: the halves stack, seam from 52% on the left edge to 48% on the right.
	   Every polygon keeps four points in the same order so clip-path can animate between them. */
	.panel {
		transition: clip-path 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.panel-left {
		clip-path: polygon(0 0, 100% 0, 100% 48%, 0 52%);
	}
	.panel-right {
		clip-path: polygon(0 52%, 100% 48%, 100% 100%, 0 100%);
	}

	/* The image box covers only this half, so object-fit shows the intended crop. */
	.art {
		left: 0;
		width: 100%;
	}
	.panel-left .art {
		top: 0;
		height: 52%;
	}
	.panel-right .art {
		top: 48%;
		height: 52%;
	}

	/* A picked half opens to the full box as --exit runs 0 to 1; the maths keeps four points in order. */
	.panel[data-picked] {
		transition: none;
	}
	.panel-left[data-picked] {
		clip-path: polygon(
			0 0,
			100% 0,
			100% calc(48% + 52% * var(--exit, 0)),
			0 calc(52% + 48% * var(--exit, 0))
		);
	}
	.panel-right[data-picked] {
		clip-path: polygon(
			0 calc(52% * (1 - var(--exit, 0))),
			100% calc(48% * (1 - var(--exit, 0))),
			100% 100%,
			0 100%
		);
	}
	.panel-left[data-picked] :is(.art, .shade) {
		top: 0;
		height: calc(52% + 48% * var(--exit, 0));
	}
	.panel-right[data-picked] :is(.art, .shade) {
		top: calc(48% * (1 - var(--exit, 0)));
		height: calc(52% + 48% * var(--exit, 0));
	}
	.panel[data-other],
	.panel[data-picked] .label {
		opacity: calc(1 - min(1, var(--exit, 0) * 2));
	}

	/* Dark in both themes: the values are the dark canvas token, not a theme variable. */
	.shade {
		background: linear-gradient(
			to top,
			rgb(20 22 25 / 0.94) 0%,
			rgb(20 22 25 / 0.5) 34%,
			rgb(20 22 25 / 0.14) 64%,
			rgb(20 22 25 / 0.55) 100%
		);
	}
	/* The shade box covers only this half, matching .art's geometry, so each half darkens
	   towards its own bottom edge instead of the gradient spanning the full stacked anchor. */
	.panel-left .shade {
		top: 0;
		height: 52%;
	}
	.panel-right .shade {
		top: 48%;
		height: 52%;
	}

	/* The label grows from its outer corner on hover, so the chosen half reads as chosen. */
	.label {
		transform-origin: bottom left;
		transition:
			opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.panel-right .label {
		transform-origin: bottom right;
	}
	/* The left half's label sits at the bottom of the full-height anchor by default, which is
	   outside .panel-left's clip polygon on the stacked mobile layout. Pull it up to just above
	   the seam, inside the top half. */
	.panel-left .label {
		bottom: calc(48% + 1.5rem);
	}

	img {
		transition: filter 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (hover: hover) {
		.panel[data-hot] img {
			filter: brightness(1.06);
		}
		.panel[data-dimmed] img {
			filter: brightness(0.55) saturate(0.7);
		}
		.panel[data-dimmed] .label {
			opacity: 0.4;
		}
	}

	/* Hover on pointer devices, focus everywhere: the arrow lights up and the label grows. */
	.panel[data-hot] .ring,
	.panel:focus-visible .ring {
		background-color: var(--ink);
		border-color: var(--ink);
		color: var(--canvas);
	}
	.panel[data-hot] .label,
	.panel:focus-visible .label {
		transform: scale(1.12);
	}

	/* The panel itself carries outline-none so the arrow fill can be the hover signal too, but
	   that leaves keyboard focus with no indicator at all. Put a visible outline back on the label. */
	.panel:focus-visible .label {
		outline: 2px solid var(--accent);
		outline-offset: 8px;
		border-radius: 2px;
	}

	@variant md {
		.panel-left {
			clip-path: polygon(0 0, var(--seam-top) 0, var(--seam-bottom) 100%, 0 100%);
		}
		.panel-right {
			clip-path: polygon(var(--seam-top) 0, 100% 0, 100% 100%, var(--seam-bottom) 100%);
		}
		.panel-left .art,
		.panel-right .art {
			top: 0;
			height: 100%;
		}
		.panel-left .shade,
		.panel-right .shade {
			top: 0;
			height: 100%;
		}
		.panel-left .label {
			bottom: 4rem;
		}
		.panel-left .art {
			left: 0;
			width: 62%;
		}
		.panel-right .art {
			left: 38%;
			width: 62%;
		}
		.panel-left[data-picked] {
			clip-path: polygon(
				0 0,
				calc(var(--seam-top) + (100% - var(--seam-top)) * var(--exit, 0)) 0,
				calc(var(--seam-bottom) + (100% - var(--seam-bottom)) * var(--exit, 0)) 100%,
				0 100%
			);
		}
		.panel-right[data-picked] {
			clip-path: polygon(
				calc(var(--seam-top) * (1 - var(--exit, 0))) 0,
				100% 0,
				100% 100%,
				calc(var(--seam-bottom) * (1 - var(--exit, 0))) 100%
			);
		}
		.panel-left[data-picked] :is(.art, .shade) {
			top: 0;
			left: 0;
			width: calc(62% + 38% * var(--exit, 0));
			height: 100%;
		}
		.panel-right[data-picked] :is(.art, .shade) {
			top: 0;
			left: calc(38% * (1 - var(--exit, 0)));
			width: calc(62% + 38% * var(--exit, 0));
			height: 100%;
		}
	}
</style>
