import type { ParamMatcher } from '@sveltejs/kit';
import { Game } from '$lib/catalog/schema';

export const match = ((param) => Game.safeParse(param).success) satisfies ParamMatcher;
