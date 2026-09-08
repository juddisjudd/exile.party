<script lang="ts">
	interface Props {
		/** Rendered width and height in px: 16 beside the wordmark, 36 on a lockup. */
		size?: number;
		class?: string;
	}

	let { size = 16, class: className = '' }: Props = $props();
</script>

<!-- The site mark: E and P in one glyph. The arms' rounded outer corners are the P; the dot is the
     E's foot and the point in the name. Same geometry as src/lib/assets/favicon.svg, keep the two in
     step. The colours are brand constants in tokens.css, not theme values, so the tile reads the same
     on both grounds: a dark square on the light canvas, a floating glyph on the dark one. -->
<svg
	viewBox="0 0 256 256"
	width={size}
	height={size}
	aria-hidden="true"
	class={['shrink-0', className]}
>
	<rect width="256" height="256" rx="56" class="fill-brand-tile" />
	<path
		class="fill-brand-glyph"
		d="M58 30h52v196h-52ZM130 30h34a48 48 0 0 1 48 48v4h-82ZM130 102h82v4a48 48 0 0 1-48 48h-34Z"
	/>
	<rect x="130" y="174" width="52" height="52" rx="19" class="fill-brand-dot" />
</svg>
