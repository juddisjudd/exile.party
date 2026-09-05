<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { MAINTAINERS, avatarUrl, profileUrl } from '$lib/maintainers';
	import { REPO_URL } from '$lib/site';

	/** GitHub could be down or a login could have changed; the monogram underneath shows through. */
	function hideBrokenAvatar(event: Event) {
		(event.currentTarget as HTMLImageElement).hidden = true;
	}
</script>

<Meta
	title="Maintainers · exile.party"
	description="The people who maintain the exile.party tool directory."
	image="maintainers.png"
	path="/maintainers"
/>

<TopBar compact />

<main class="mx-auto w-full max-w-[1180px] flex-1 px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
	<div>
		<h1 class="text-[26px] leading-tight font-medium tracking-tight text-ink sm:text-[30px]">
			Maintainers
		</h1>
		<!-- Runs the full column so it sits on one line on a wide screen; `pretty` keeps the
		     last word off a line of its own once it does start wrapping. -->
		<p class="mt-3 text-[15px] leading-relaxed text-pretty text-muted">
			The people who keep this directory running. Anyone can add a listing: the catalogue is a
			single YAML file and takes pull requests.
		</p>
	</div>

	<ul class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each MAINTAINERS as person (person.login)}
			<li>
				<a
					href={profileUrl(person.login)}
					rel="external noopener"
					class="flex items-center gap-3.5 rounded-lg border border-line bg-surface p-4 transition-colors duration-100 hover:border-line-strong"
				>
					<span
						class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-raised/40 text-[15px] font-medium text-muted"
					>
						<span class="col-start-1 row-start-1">{person.login.charAt(0).toUpperCase()}</span>
						<img
							src={avatarUrl(person.login)}
							alt=""
							width="48"
							height="48"
							decoding="async"
							referrerpolicy="no-referrer"
							onerror={hideBrokenAvatar}
							class="col-start-1 row-start-1 size-12 rounded-full object-cover"
						/>
					</span>

					<span class="min-w-0">
						<span class="block truncate text-[14px] font-medium text-ink">
							{person.name ?? person.login}
						</span>
						<span class="block truncate text-[12.5px] text-faint">
							{person.role ?? `@${person.login}`}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>

	<p class="mt-8 text-[12.5px] text-faint">
		Everyone who has contributed is listed on
		<a
			href="{REPO_URL}/graphs/contributors"
			rel="external noopener"
			class="text-accent transition-colors duration-100">the repository</a
		>.
	</p>
</main>

<SiteFooter />
