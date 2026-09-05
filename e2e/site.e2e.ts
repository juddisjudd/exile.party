import { expect, test } from '@playwright/test';

test('home is a hero that links into the directory', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText(/Third-party tools for Path.of.Exile/);
	await page.getByRole('link', { name: 'Browse tools' }).click();
	await expect(page).toHaveURL(/\/tools$/);
});

test('a home category links to a filtered directory', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Trade/ }).click();
	await expect(page).toHaveURL(/\/tools\?cat=trade$/);
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
	await page.goto('/');
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
	await page.goto('/');
	await page.getByRole('button', { name: 'Dark' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.getByRole('button', { name: 'Light' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	// The scoping attribute must be cleaned up, or the rules leak into later transitions.
	await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.*/);
});

test('the footer reaches the maintainers page', async ({ page }) => {
	await page.goto('/');
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
