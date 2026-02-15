import { expect, test } from '@playwright/test';
import { clearAuthState, loginAs } from './helpers/auth';

test.describe('Auth and RBAC smoke', () => {
    test.describe.configure({ mode: 'serial' });

    test('login page is reachable for unauthenticated user', async ({ page }) => {
        await clearAuthState(page);
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'OpEx 5.0' })).toBeVisible();
    });

    test('admin first login is redirected to forced password change', async ({ page }) => {
        await clearAuthState(page);
        await page.goto('/login');

        await page.getByLabel('Sicil No').fill('ADMIN001');
        await page.getByLabel('Şifre').fill('Admin123');
        await page.getByRole('button', { name: 'Giriş Yap' }).click();

        await page.waitForURL('**/change-password');
        await expect(page.getByRole('heading', { name: 'Şifre Değiştir' })).toBeVisible();
    });

    test('authenticated USER cannot access admin page', async ({ page }) => {
        await loginAs(page, 'USER');
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(page.getByText('OpEx 5.0', { exact: false }).first()).toBeVisible();
    });

    test('committee manager sees all suggestions page', async ({ page }) => {
        await loginAs(page, 'COMMITTEE_MANAGER');
        await page.getByRole('button', { name: 'Önerilerim' }).first().click();
        await expect(page.getByRole('heading', { name: 'Tüm Öneriler' })).toBeVisible();
    });

    test('approver sees approval queue page', async ({ page }) => {
        await loginAs(page, 'APPROVER');
        await page.getByRole('button', { name: 'Önerilerim' }).first().click();
        await expect(page.getByRole('heading', { name: 'Onay Bekleyenler' })).toBeVisible();
    });
});
