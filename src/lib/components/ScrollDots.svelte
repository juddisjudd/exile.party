<script lang="ts">
	import { onMount } from 'svelte';

	export interface Step {
		/** id of the element to jump to. */
		id: string;
		label: string;
	}

	interface Props {
		steps: Step[];
	}

	let { steps }: Props = $props();

	let active = $state(0);

	/** Sits below the sticky header, so a section counts as reached once it clears the bar. */
	const LINE = 96;

	function measure() {
		const y = scrollY;
		// The last sections can never reach the line, because the page stops scrolling first.
		// Comparing against the clamped landing position lets them still count as reached.
		const furthest = Math.max(0, document.documentElement.scrollHeight - innerHeight);

		let next = 0;
		for (let i = 0; i < steps.length; i++) {
			const el = document.getElementById(steps[i].id);
			if (!el) continue;
			const landing = Math.min(el.getBoundingClientRect().top + y - LINE, furthest);
			if (y >= landing - 2) next = i;
		}
		active = next;
	}

	function go(step: Step) {
		const el = document.getElementById(step.id);
		if (!el) return;
		el.scrollIntoView({
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			block: 'start'
		});
	}

	onMount(() => {
		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				measure();
			});
		};

		addEventListener('scroll', onScroll, { passive: true });
		addEventListener('resize', onScroll, { passive: true });
		measure();

		return () => {
			removeEventListener('scroll', onScroll);
			removeEventListener('resize', onScroll);
		};
	});

	// measure() reads `steps`, so filtering the list re-runs this and moves the highlight.
	$effect(measure);
</script>

{#if steps.length > 1}
	<nav
		aria-label="Jump to category"
		class="fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 xl:block"
	>
		<ul class="flex flex-col items-end gap-2">
			{#each steps as step, i (step.id)}
				<li>
					<button
						type="button"
						onclick={() => go(step)}
						aria-current={i === active ? 'true' : undefined}
						class="group flex items-center gap-2"
					>
						<span
							class="pointer-events-none rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] whitespace-nowrap text-muted opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100"
						>
							{step.label}
						</span>
						<span
							class="w-1.5 rounded-full transition-all duration-200 {i === active
								? 'h-5 bg-accent'
								: 'h-1.5 bg-faint/45 group-hover:bg-ink'}"
						></span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
