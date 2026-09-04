import { expect, test } from '@playwright/test';

test('home lists tools grouped by category', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText(/Path of Exile tools/);
	await expect(page.locator('a[href*="tools/"]').first()).toBeVisible();
});

test('tool page loads from the home link', async ({ page }) => {
	await page.goto('/');
	const first = page.locator('a[href*="tools/"]').first();
	const name = await first.textContent();
	await first.click();
	await expect(page.locator('h1')).toHaveText(name!.trim());
});

test('unknown tool id is a 404', async ({ page }) => {
	const res = await page.goto('/tools/does-not-exist');
	expect(res?.status()).toBe(404);
});
