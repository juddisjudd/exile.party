<script lang="ts">
	import { OG_HEIGHT, OG_WIDTH, SITE_NAME, SITE_URL, ogImage } from '$lib/site';

	interface Props {
		/** Shown in the tab and as the card headline. */
		title: string;
		description: string;
		/** File name inside static/og, e.g. "home.png". */
		image: string;
		/** Absolute path on this site, e.g. "/tools". */
		path: string;
	}

	let { title, description, image, path }: Props = $props();

	const url = $derived(`${SITE_URL}${path}`);
	const card = $derived(ogImage(image));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={card} />
	<meta property="og:image:width" content={String(OG_WIDTH)} />
	<meta property="og:image:height" content={String(OG_HEIGHT)} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={card} />
</svelte:head>
