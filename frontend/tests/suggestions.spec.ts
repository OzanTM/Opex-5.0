import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Suggestion Lifecycle', () => {
    test.describe.configure({ mode: 'serial' });

    test('should create a new suggestion and see it in the list', async ({ page }) => {
        await loginAs(page, 'USER');
        await page.getByRole('button', { name: 'Yeni Öneri' }).first().click();
        await page.waitForURL('**/suggestions/new');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.getByRole('heading', { name: 'Yeni Öneri Oluştur' })).toBeVisible();

        const uniqueTitle = `Test Suggestion ${Date.now()}`;
        await page.getByPlaceholder('Önerinizin kısa ve açıklayıcı bir başlığını yazın').fill(uniqueTitle);

        await page.locator('select').first().selectOption('KAIZEN');
        await page.getByPlaceholder('Önerdiğiniz çözümü detaylı olarak açıklayın').fill('This is a test suggestion created by Playwright E2E test.');
        await page.getByPlaceholder('Şu anki durumu detaylı olarak açıklayın. Sorun veya iyileştirme alanı nedir?').fill('Current situation description.');
        await page.getByRole('checkbox', { name: 'Maliyet Tasarrufu' }).check();

        await page.getByRole('button', { name: /Kaydet ve Gönder/ }).click();

        await page.waitForURL('**/suggestions');

        await page.reload();
        await expect(page.getByText(uniqueTitle)).toBeVisible();
    });

});
