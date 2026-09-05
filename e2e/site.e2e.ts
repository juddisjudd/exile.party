import { expect, test } from '@playwright/test';

test('a game page is a hero that links into its directory', async ({ page }) => {
	await page.goto('/poe1');
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile');
	await page.getByRole('link', { name: /^Browse all \d+ tools$/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe1$/);
});

test('a game page category links to a filtered directory', async ({ page }) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: /^Trade/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe1&cat=trade$/);
});

test('the chooser offers both games with live counts', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Welcome to the Party, Exile');
	await expect(page.getByRole('link', { name: /^Path of Exile tools, \d+ listed$/ })).toBeVisible();
	await expect(
		page.getByRole('link', { name: /^Path of Exile 2 tools, \d+ listed$/ })
	).toBeVisible();
});

test('picking a game lands on its page and is remembered', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile 2 tools/ }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile 2');
	await expect(page.evaluate(() => localStorage.getItem('exile.game'))).resolves.toBe('poe2');
	await page.goto('/');
	await expect(page).toHaveURL(/\/poe2$/);
	await page.goto('/?choose');
	await expect(page.locator('h1')).toHaveText('Welcome to the Party, Exile');
});

test('the chooser works without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('/');
	// position: both halves are full-viewport <a> elements distinguished only by clip-path, so
	// their bounding-box centers coincide exactly on the seam and the click would otherwise land
	// on whichever half paints on top there. A real pointer never lands on that literal hairline;
	// this aims the click at the corner that is unambiguously the left half's.
	await page
		.getByRole('link', { name: /^Path of Exile tools/ })
		.click({ position: { x: 20, y: 20 } });
	await expect(page).toHaveURL(/\/poe1$/);
	await context.close();
});

test('directory lists tool cards', async ({ page }) => {
	await page.goto('/tools');
	await expect(page.locator('h1')).toHaveText('All tools');
	await expect(page.locator('a[href^="/tools/"]').first()).toBeVisible();
});

test('tool page loads from the directory', async ({ page }) => {
	await page.goto('/tools');
	const first = page.locator('a[href^="/tools/"]').first();
	const name = await first.textContent();
	await first.click();
	await expect(page.locator('h1')).toHaveText(name!.trim());
});

test('unknown tool id is a 404', async ({ page }) => {
	const res = await page.goto('/tools/does-not-exist');
	expect(res?.status()).toBe(404);
});

test('the submit dialog explains the pull request flow and closes on Escape', async ({ page }) => {
	await page.goto('/poe1');
	await page.getByRole('button', { name: 'Submit a tool' }).first().click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText('tools.yaml');
	await expect(dialog).toContainText('bun run validate');
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('the theme toggle still lands on the chosen theme through the view transition', async ({
	page
}) => {
	await page.goto('/poe1');
	await page.getByRole('button', { name: 'Dark' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.getByRole('button', { name: 'Light' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	// The scoping attribute must be cleaned up, or the rules leak into later transitions.
	await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.*/);
});

test('the footer reaches the maintainers page', async ({ page }) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: 'Maintainers' }).click();
	await expect(page).toHaveURL(/\/maintainers$/);
	await expect(page.locator('h1')).toHaveText('Maintainers');
	await expect(page.getByRole('link', { name: /juddisjudd/ })).toBeVisible();
});

test('a game page has a start-here strip and links into its filtered directory', async ({
	page
}) => {
	await page.goto('/poe2');
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile 2');
	await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
	await expect(page.locator('a[href^="/tools/"]').first()).toBeVisible();
	await page.getByRole('link', { name: /^Browse all \d+ tools$/ }).click();
	await expect(page).toHaveURL(/\/tools\?game=poe2$/);
});

test('the game page search hands the query to the directory', async ({ page }) => {
	await page.goto('/poe1');
	const search = page.getByLabel('Search tools').first();
	await search.fill('trade');
	await search.press('Enter');
	await expect(page).toHaveURL(/\/tools\?game=poe1&q=trade$/);
	await expect(page.locator('h1')).toHaveText('All tools');
});

test('the switch-game link reaches the chooser with the escape-hatch querystring', async ({
	page
}) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: 'Switch game' }).first().click();
	await expect(page).toHaveURL(/\/\?choose$/);
});

test('the pick dissolves into the game page and cleans up the transition attribute', async ({
	page
}) => {
	await page.goto('/');
	await page
		.getByRole('link', { name: /^Path of Exile tools/ })
		.click({ position: { x: 20, y: 20 } });
	await expect(page).toHaveURL(/\/poe1$/);
	await expect(page.locator('h1')).toHaveText('Tools for Path of Exile');
	// The scoping attribute must be cleaned up, or the rules leak into later transitions.
	await expect(page.locator('html')).not.toHaveAttribute('data-choose-transition', /.*/);
});

test('reduced motion skips straight to the game page', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile 2 tools/ }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await expect(page.locator('html')).not.toHaveAttribute('data-choose-transition', /.*/);
});

test('client-side navigation to / also honours the remembered game', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile 2 tools/ }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await page.goto('/poe1');
	await page.getByRole('link', { name: 'exile.party home' }).click();
	await expect(page).toHaveURL(/\/poe2$/);
	await page.getByRole('link', { name: 'Switch game' }).first().click();
	await expect(page).toHaveURL(/\/\?choose$/);
	await expect(page.locator('h1')).toHaveText('Welcome to the Party, Exile');
});

test('a panel can be picked from the keyboard', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Path of Exile tools/ }).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/poe1$/);
});

test('a modifier click on a panel is left to the browser', async ({ page, context }) => {
	await page.goto('/');
	const [popup] = await Promise.all([
		context.waitForEvent('page'),
		page
			.getByRole('link', { name: /^Path of Exile 2 tools/ })
			.click({ modifiers: ['ControlOrMeta'] })
	]);
	await expect(popup).toHaveURL(/\/poe2$/);
	await expect(page).toHaveURL(/\/$/);
});

test('back from a picked game does not trap the visitor', async ({ page }) => {
	await page.goto('/poe1');
	await page.getByRole('link', { name: 'Switch game' }).first().click();
	await expect(page).toHaveURL(/\/\?choose$/);
	const poe2 = page.getByRole('link', { name: /^Path of Exile 2 tools/ });
	// position: "Switch game" sits over the poe1 half, and the browser re-hit-tests the stationary
	// pointer against the new page, so poe1 is still hovered here with no mouse movement at all.
	// Both panels are identical full-viewport <a> elements, so an unqualified click lands on their
	// shared bounding-box center, which the still-hovered poe1 half claims via the seam's hover
	// shift. Aim at the corner that is unambiguously poe2's regardless of that shift.
	const box = await poe2.boundingBox();
	await poe2.click({ position: { x: box!.width - 20, y: 20 } });
	await expect(page).toHaveURL(/\/poe2$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/poe1$/);
});
