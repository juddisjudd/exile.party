import { z } from 'zod';

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const id = z.string().regex(kebab, 'kebab-case id');
const https = z.url({ protocol: /^https$/ });

export const Game = z.enum(['poe1', 'poe2']);
export const Status = z.enum(['active', 'unmaintained', 'dead']);
export const Pricing = z.enum(['free', 'freemium', 'paid']);
export const Platform = z.enum(['windows', 'macos', 'linux', 'web', 'android', 'ios']);

export const Category = z.strictObject({
	id,
	name: z.string().min(1),
	description: z.string().max(120).optional()
});

export const Tool = z
	.strictObject({
		id,
		name: z.string().min(1),
		description: z.string().min(10).max(300),
		url: https,
		urls: z.strictObject({ poe1: https.optional(), poe2: https.optional() }).optional(),
		games: z.array(Game).nonempty(),
		category: id,
		tags: z.array(z.string().regex(kebab)).default([]),
		platforms: z.array(Platform).nonempty(),
		pricing: Pricing,
		source: https.optional(),
		status: Status,
		lastVerified: z.iso.date(),
		notes: z.string().max(300).optional()
	})
	.refine((t) => Object.keys(t.urls ?? {}).every((g) => t.games.includes(g as Game)), {
		message: 'urls keys must be listed in games',
		path: ['urls']
	});

export const Catalog = z
	.strictObject({
		categories: z.array(Category).nonempty(),
		tools: z.array(Tool)
	})
	.superRefine((c, ctx) => {
		const cats = new Set(c.categories.map((x) => x.id));
		const seen = new Set<string>();
		c.tools.forEach((t, i) => {
			if (seen.has(t.id)) {
				ctx.addIssue({ code: 'custom', path: ['tools', i, 'id'], message: `duplicate id ${t.id}` });
			}
			seen.add(t.id);
			if (!cats.has(t.category)) {
				ctx.addIssue({
					code: 'custom',
					path: ['tools', i, 'category'],
					message: `unknown category ${t.category}`
				});
			}
		});
	});

export type Game = z.infer<typeof Game>;
export type Tool = z.infer<typeof Tool>;
export type Category = z.infer<typeof Category>;
export type Catalog = z.infer<typeof Catalog>;
