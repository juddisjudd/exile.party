# Game selection landing

Date: 2026-09-05. Status: awaiting approval.

Design canvas: https://claude.ai/code/artifact/9a9b7423-8fc0-4b39-85a3-5944aa77108b

## Goal

`/` becomes a full-viewport chooser between Path of Exile 1 and 2. Picking a game
animates the chosen half open and lands on a per-game home page. Two personas:

- New player, probably PoE 2: needs a curated first screen, not 25 cards and filter chips.
- Existing player: wants the directory for their game, fast, and never wants to be
  asked twice.

Decisions already taken (in conversation, 2026-09-05):

| Question              | Decision                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Destination           | New `/poe1` and `/poe2` pages holding today's home content, scoped        |
| Split shape           | Shallow diagonal, full-bleed, about 7 degrees off vertical                |
| Art                   | Official GGG wallpaper art, artwork only, logos cropped out, GGG credited |
| Theme on the chooser  | Always dark; destination honours the user's theme                         |
| Hover                 | Modest: seam shifts 8%, other half dims                                   |
| Memory                | Remember the pick and auto-redirect `/` to it                             |
| Side copy             | Game label, one-liner, live tool count                                    |
| Nudge for new players | Omitted                                                                   |

## Routes

| Route                         | Change                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Becomes the chooser. Keeps the SEO title and description the home page has today.                                                                                                |
| `/?choose`                    | Same page; the querystring only suppresses the redirect below.                                                                                                                   |
| `/poe1`, `/poe2`              | New. The directory locked to that game: same page as `/tools`, game fixed by the route, context pill with Switch game in the top bar, filters round-trip without a `game` param. |
| `/tools`                      | Unchanged. The chooser's "Browse all tools" link points here with no game filter.                                                                                                |
| `/tools/[id]`, `/maintainers` | Unchanged.                                                                                                                                                                       |

Today's `/` content (hero, category list for both games) is retired. Its pieces move to
the per-game page.

## Remembering the pick

- `src/lib/game.ts`: `GAME_KEY = 'exile.game'` and `rememberGame(game, store)`, where
  `store` is the `getItem`/`setItem` subset of `Storage` so tests pass a plain object.
  Same try/catch shape as `theme.svelte.ts`. The inline script below reads it on full
  loads; the root layout reads it through `readGame` in a `beforeNavigate` guard for
  client-side navigation, leaving popstate alone so Back is never trapped. `pick()`
  navigates with `replaceState`, so `/` never sits in history behind a game page.
- `src/app.html` gains a second inline script, before paint: if `location.pathname`
  is `/` and the querystring does not contain `choose` and the stored value is `poe1`
  or `poe2`, `location.replace('/' + game)`. The key is duplicated there with a keep-in-sync
  comment, as the theme key already is.
- The chooser sets the value on click, before navigating. Nothing else writes it. The
  `/tools` game toggle is a filter, not a preference, and does not persist.
- Escape hatch: the per-game page's top bar has a "Switch game" link to `/?choose`.
  Picking again overwrites the stored value.
- Crawlers and first visits have no stored value and see the chooser.

## Chooser page

`src/routes/+page.svelte` composes two `GamePanel` components. `+page.server.ts` returns
per-game tool counts.

Layout, desktop (from the canvas, Direction A):

- Two full-height panels. Left is PoE 1, right is PoE 2. Each panel is a real `<a>` to its
  game page, so it works without JS, is keyboard focusable, and hover preloads the
  destination through the existing `data-sveltekit-preload-data="hover"`.
- Seam runs from 54% at the top to 46% at the bottom. Panels are clipped with
  `clip-path: polygon(...)` on full-size containers; the image sits in a box the width
  of its half so `object-fit: cover` shows the intended crop.
- Overlay per panel: bottom-heavy dark gradient for the labels, light top gradient for
  the header, and a radial darkening behind the headline block.
- Header: brand left. "Browse all tools" right. No theme toggle here.
- Headline block, centred over the seam: "Welcome to the Party, Exile" (58px, 500),
  "Explore tools for Path of Exile" (17px, muted), "Choose your game" (11px uppercase
  eyebrow with hairlines).
- Labels, bottom of each half: "Path of Exile" / "Path of Exile 2" (30px, 500), one-liner
  ("The original. A decade of tools." / "The sequel. Early access, new systems."), then
  a 36px circle with an arrow, "Select", and the live count.
- Credit, bottom centre, 11px faint: "Artwork by Grinding Gear Games. Not affiliated
  with GGG."
- Hover (pointer devices only, `@media (hover: hover)`): the seam shifts 8% away from the
  hovered half (58/42), the hovered image brightens slightly, the other dims to 55%
  brightness and 70% saturation, the hovered circle fills with `--accent-fill`. All
  transitions 200ms. The headline does not move.

Layout, below `md`: a canvas-coloured band at the top holds the brand and the headline
block. The two halves stack beneath it, the diagonal kept between them (from 52% on the
left edge to 48% on the right), labels inside each half. No hover effects.

Always dark: `tokens.css` gains `[data-force-theme='dark']` alongside
`:root[data-theme='dark']` in the explicit-dark block, so a wrapper element re-declares the
dark token values for its subtree and every `text-ink`, `bg-canvas` utility inside picks
them up. The chooser's root carries that attribute and `min-h-dvh`.

Art: `src/lib/assets/chooser/poe1.{jpg,webp}` (Warden of Eaves) and `poe2.{jpg,webp}`
(Viper Napuatzi), cropped to exclude the GGG logo, about 1800px on the long side,
served through `<picture>`. Direction B on the canvas (Primal Huntress and Diamora) is
the alternate pair; the code takes whichever pair is approved and nothing else changes.

## The transition

On click, with JS:

1. `rememberGame(game)`.
2. If `prefers-reduced-motion: reduce` or `document.startViewTransition` is missing:
   `goto(href, { replaceState: true })` and stop — no transition at all.
3. Otherwise call `requestReveal()` in `game.ts`, then `goto(href, { replaceState: true })`.
   There is no expand stage on the chooser itself; the click hands straight off to the
   navigation.
4. `+layout.svelte` registers `onNavigate`. When `takeReveal()` returns true it
   sets `data-choose-transition` on `<html>`, and wraps the navigation in
   `document.startViewTransition` using the SvelteKit-documented pattern (resolve inside
   the callback, then `await navigation.complete`). `transition.finished` removes the
   attribute. Every other navigation is untouched.
5. `layout.css`: under `html[data-choose-transition]`, `::view-transition-new(root)` gets no
   animation and sits underneath (`z-index: 1`) so the game page is rendered solid from the
   first frame, as if it had been there all along. `::view-transition-old(root)` sits above
   it (`z-index: 2`) and dissolves away over 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`: opacity
   to 0 and a slight zoom, `scale(1.04)`. Both keep `mix-blend-mode: normal`, the same
   scoping trick the theme reveal uses with `data-theme-transition`.

Total about 700ms — one motion, not two. Back navigation from the game page to `/` shows
the chooser only via `?choose`; a plain `/` redirects again, which is the intended memory
behaviour.

## Per-game page

`/poe1` and `/poe2` are the directory (`src/lib/components/ToolDirectory.svelte`, shared
with `/tools`) with the game locked by the route: the top bar shows the context pill
("PoE 1" / "PoE 2" plus "Switch game", to `/?choose`) instead of the toggle, the h1 reads
"Path of Exile tools" / "Path of Exile 2 tools", and filters round-trip through the URL
without a `game` param. The hero, `HeroOcean`, the "Start here" strip and the category
list that used to live on this page were dropped after comparing them against the
directory view and preferring the directory.

Meta: title "Path of Exile 2 tools · exile.party", description naming the game, OG image
`poe1.png` / `poe2.png` added to `scripts/og.ts` via the existing `pageCard`.

## Data helpers

Pure functions in `src/lib/catalog/home.ts`, safe on both sides:

- `countByGame(tools): Record<Game, number>`

## Testing

Vitest, server project, inline fixtures built with a `tool()` helper as `filter.spec.ts`
does today:

- `countByGame` against the fixture.
- `game.svelte.ts` read/write round trip and the private-mode catch.

Playwright, `e2e/site.e2e.ts`:

- `/` renders both game links with counts.
- Clicking PoE 2 lands on `/poe2` with the "Start here" heading.
- After that, loading `/` lands on `/poe2`; `/?choose` shows the chooser.
- `/poe1` and `/poe2` both build (prerender `strict` fails otherwise).
- Reduced-motion emulation: clicking navigates without waiting on animations.
- Existing tests that start at `/` and expect the old hero, the submit dialog, the theme
  toggle or the footer move to `/poe1`, which is where those now live.

Both runners need `bunx playwright install chromium` once on this machine; the vitest
client project uses the same browser.

## Out of scope

- Per-game OG art beyond the text card.
- Changing `/tools` filter defaults or persisting the toggle there.
- A light treatment of the chooser.
- Emailing GGG about the artwork. Recommended, done by the maintainers, not by this change.
