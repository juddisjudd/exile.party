<script lang="ts">
	export interface Crumb {
		label: string;
		/** Absent on the last crumb, which is the page itself. */
		href?: string;
	}

	interface Props {
		items: Crumb[];
	}

	let { items }: Props = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-faint">
		<!-- eslint-disable-next-line svelte/require-each-key -- nothing on a crumb is unique (a tool may be named after its category), and the trail is a fixed list rebuilt per page, so index order is the key -->
		{#each items as item, i}
			<li class="flex items-center gap-2">
				{#if i > 0}
					<span aria-hidden="true" class="text-faint/60">/</span>
				{/if}
				{#if item.href}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller builds hrefs with resolve() and a fragment -->
					<a href={item.href} class="transition-colors duration-100 hover:text-ink">{item.label}</a>
				{:else}
					<span aria-current="page" class="text-muted">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
