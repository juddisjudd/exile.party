import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Renderer } from '@takumi-rs/core';
import { render } from 'takumi-js';
import { loadCatalog } from '../src/lib/server/catalog';
import {
	GAME_LABEL,
	GAME_NAME,
	PLATFORM_LABEL,
	PRICING_LABEL,
	monogram
} from '../src/lib/catalog/display';
import { countByGame } from '../src/lib/catalog/home';
import { SITE_NAME } from '../src/lib/site';

const OUT = resolve(process.cwd(), 'static/og');
/** static/og is gitignored, so the README banner needs a copy that is committed. */
const BANNER = resolve(process.cwd(), '.github/og.png');
const WIDTH = 1200;
const HEIGHT = 630;

/* The dark half of the token set, inlined: the image cannot read CSS variables, and a card
   that renders dark reads correctly against both light and dark chat backgrounds. */
const C = {
	canvas: '#141619',
	surface: '#191c21',
	line: '#262930',
	ink: '#eceded',
	muted: '#b3b4bd',
	faint: '#82848f',
	// The mark's constants, as in tokens.css and favicon.svg.
	tile: '#141619',
	glyph: '#bed7d7',
	dot: '#7b8ff0'
};

const FONT_DIR = 'node_modules/@fontsource-variable/geist/files';

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** The mark, built from boxes because the renderer cannot take the SVG: the same 256-unit geometry
 *  as src/lib/assets/favicon.svg, scaled to `px`. */
function mark(px: number): string {
	const u = px / 256;
	const box = (l: number, t: number, w: number, h: number, bg: string, corner = '') =>
		`<div style="display:flex;position:absolute;left:${l * u}px;top:${t * u}px;width:${w * u}px;height:${h * u}px;background:${bg};${corner}"></div>`;
	return `<div style="display:flex;position:relative;width:${px}px;height:${px}px;border-radius:${56 * u}px;background:${C.tile}">
      ${box(58, 30, 52, 196, C.glyph)}
      ${box(130, 30, 82, 52, C.glyph, `border-top-right-radius:${48 * u}px`)}
      ${box(130, 102, 82, 52, C.glyph, `border-bottom-right-radius:${48 * u}px`)}
      ${box(130, 174, 52, 52, C.dot, `border-radius:${19 * u}px`)}
    </div>`;
}

/** Shared chrome: the mark and the name top-left, the page's eyebrow top-right. */
function card(body: string, eyebrow: string): string {
	return `<div style="display:flex;flex-direction:column;width:100%;height:100%;background:${C.canvas};font-family:Geist;padding:72px 80px;position:relative">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:14px">
        ${mark(36)}
        <div style="display:flex;font-size:26px;font-weight:500;color:${C.ink}">${esc(SITE_NAME)}</div>
      </div>
      <div style="display:flex;font-size:22px;color:${C.faint}">${esc(eyebrow)}</div>
    </div>
    ${body}
  </div>`;
}

function chip(text: string): string {
	return `<div style="display:flex;border:1px solid ${C.line};border-radius:8px;padding:6px 14px;font-size:22px;color:${C.muted}">${esc(text)}</div>`;
}

function toolCard(tool: ReturnType<typeof loadCatalog>['tools'][number], category: string): string {
	const meta = [
		PRICING_LABEL[tool.pricing],
		tool.openSource ? 'Open source' : 'Closed source',
		tool.platforms.map((p) => PLATFORM_LABEL[p]).join(', ')
	];

	return card(
		`<div style="display:flex;flex-direction:column;flex:1;justify-content:center">
      <div style="display:flex;align-items:center;gap:28px">
        <div style="display:flex;align-items:center;justify-content:center;width:96px;height:96px;border:1px solid ${C.line};border-radius:20px;font-size:48px;font-weight:500;color:${C.muted};background:${C.surface}">${esc(monogram(tool.name))}</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;font-size:64px;font-weight:600;color:${C.ink};letter-spacing:-1.5px">${esc(tool.name)}</div>
          <div style="display:flex;gap:12px;font-size:22px;color:${C.faint}">${tool.games.map((g) => esc(GAME_LABEL[g])).join(' &middot; ')}</div>
        </div>
      </div>
      <div style="display:flex;margin-top:36px;font-size:30px;line-height:1.4;color:${C.muted};max-width:940px">${esc(tool.description)}</div>
    </div>
    <div style="display:flex;gap:12px">${meta.map(chip).join('')}</div>`,
		category
	);
}

function pageCard(title: string, subtitle: string, eyebrow: string): string {
	return card(
		`<div style="display:flex;flex-direction:column;flex:1;justify-content:center">
      <div style="display:flex;font-size:78px;font-weight:600;color:${C.ink};letter-spacing:-2.5px;line-height:1.08;max-width:900px">${esc(title)}</div>
      <div style="display:flex;margin-top:28px;font-size:30px;color:${C.muted};max-width:820px">${esc(subtitle)}</div>
    </div>`,
		eyebrow
	);
}

async function main() {
	const catalog = loadCatalog();
	const counts = countByGame(catalog.tools);
	const renderer = new Renderer();

	// One variable file, declared at both weights the cards use.
	const regular = readFileSync(`${FONT_DIR}/geist-latin-wght-normal.woff2`);
	await renderer.registerFont({ name: 'Geist', data: regular, weight: 400 });
	await renderer.registerFont({ name: 'Geist', data: regular, weight: 600 });

	rmSync(OUT, { recursive: true, force: true });
	mkdirSync(OUT, { recursive: true });

	const jobs: { file: string; html: string }[] = [
		{
			file: 'home.png',
			html: pageCard(
				'Third-party tools for Path of Exile 1 & 2',
				`A directory of ${catalog.tools.length} community tools. Every listing says what platform it runs on, what it costs, and whether the source is open.`,
				''
			)
		},
		{
			file: 'tools.png',
			html: pageCard(
				'All tools',
				`${catalog.tools.length} tools across ${catalog.categories.length} categories. Filter by game, platform, price, and licence.`,
				'Directory'
			)
		},
		{
			file: 'maintainers.png',
			html: pageCard(
				'Maintainers',
				'The people who keep this directory running. Anyone can add a listing by pull request.',
				''
			)
		},
		...(['poe1', 'poe2'] as const).map((game) => ({
			file: `${game}.png`,
			html: pageCard(
				`${GAME_NAME[game]} tools`,
				`${counts[game]} community tools for ${GAME_NAME[game]}, filterable by platform, price, and licence.`,
				GAME_NAME[game]
			)
		}))
	];

	for (const tool of catalog.tools) {
		const category = catalog.categories.find((c) => c.id === tool.category);
		jobs.push({
			file: `tool-${tool.id}.png`,
			html: toolCard(tool, category?.name ?? tool.category)
		});
	}

	for (const job of jobs) {
		const buffer = await render(job.html, {
			renderer,
			width: WIDTH,
			height: HEIGHT,
			format: 'png'
		});
		writeFileSync(resolve(OUT, job.file), buffer);
		if (job.file === 'home.png') writeFileSync(BANNER, buffer);
	}

	console.log(`og: wrote ${jobs.length} images to static/og, plus .github/og.png`);
}

await main();
