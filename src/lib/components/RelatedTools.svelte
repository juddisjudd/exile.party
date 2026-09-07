<script lang="ts">
	import type { Tool } from '$lib/catalog/schema';
	import ToolCard from './ToolCard.svelte';

	interface Props {
		tools: Tool[];
	}

	let { tools }: Props = $props();
</script>

{#if tools.length > 0}
	<section class="mt-16 border-t border-line pt-10">
		<h2 class="text-[15px] font-medium tracking-tight text-ink">You might also want</h2>
		<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each tools as tool (tool.id)}
				<ToolCard {tool} />
			{/each}
		</ul>
	</section>
{/if}
