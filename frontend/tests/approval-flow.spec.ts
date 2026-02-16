import { expect, test, type Page } from '@playwright/test';
import { clearAuthState, loginAs } from './helpers/auth';

const disableBlockingDialogs = async (page: Page) => {
    await page.addInitScript(() => {
        window.alert = () => {};
        window.confirm = () => true;
        window.prompt = () => null;
    });
};

const createSuggestionViaUI = async (page: Page, title: string) => {
    await page.getByRole('button', { name: 'Yeni Öneri' }).first().click();
    await page.waitForURL('**/suggestions/new');

    await page.getByPlaceholder('Önerinizin kısa ve açıklayıcı bir başlığını yazın').fill(title);
    await page.locator('select').first().selectOption('KAIZEN');
    await page.getByPlaceholder('Önerdiğiniz çözümü detaylı olarak açıklayın').fill('Playwright approval flow test solution details.');
    await page.getByPlaceholder('Şu anki durumu detaylı olarak açıklayın. Sorun veya iyileştirme alanı nedir?').fill('Playwright approval flow current situation details.');
    await page.getByRole('checkbox', { name: 'Maliyet Tasarrufu' }).check();

    await page.getByRole('button', { name: /Kaydet ve Gönder/ }).click();
    await page.waitForURL('**/suggestions');
    await expect(page.getByText(title)).toBeVisible();
};

const openSuggestionFromList = async (page: Page, title: string) => {
    await page.goto('/suggestions');
    await page.getByText(title).first().click();
    await page.waitForURL('**/suggestions/*');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

test.describe('End-to-end approval flow', () => {
    test.describe.configure({ mode: 'serial' });

    test('USER creates -> COMMITTEE approves -> APPROVER approves', async ({ page }) => {
        test.setTimeout(120000);
        const suggestionTitle = `Approval Flow Suggestion ${Date.now()}`;

        await disableBlockingDialogs(page);
        await clearAuthState(page);

        await loginAs(page, 'USER');
        await createSuggestionViaUI(page, suggestionTitle);

        await loginAs(page, 'COMMITTEE_MANAGER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Komite İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Onayla' }).first().click();
        await expect(page.getByRole('heading', { name: 'Öneriyi Onayla' })).toBeVisible();

        const committeeApproveModal = page.getByRole('heading', { name: 'Öneriyi Onayla' }).locator('..');
        await committeeApproveModal.locator('select').first().selectOption('KAIZEN');
        await committeeApproveModal.locator('select').nth(1).selectOption({ index: 1 });
        await page.getByPlaceholder('Varsa eklemek istediğiniz notlar...').fill('Komite onayi e2e test notu.');

        await committeeApproveModal.getByRole('button', { name: 'Onayla ve Gönder' }).click();
        await expect(page.getByText('Müdür Onayında')).toBeVisible();

        await loginAs(page, 'APPROVER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Yönetici İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Onayla' }).first().click();
        await expect(page.getByRole('heading', { name: 'Öneriyi Onayla' })).toBeVisible();

        await page.getByPlaceholder('Varsa eklemek istediğiniz notlar...').fill('Mudur onayi e2e test notu.');

        const managerApproveModal = page.getByRole('heading', { name: 'Öneriyi Onayla' }).locator('..');
        await managerApproveModal.getByRole('button', { name: 'Onayla' }).click();

        await expect(page.getByText('Onaylandı')).toBeVisible();
    });

    test('COMMITTEE requests revision from USER suggestion', async ({ page }) => {
        test.setTimeout(120000);
        const suggestionTitle = `Revision Flow Suggestion ${Date.now()}`;

        await disableBlockingDialogs(page);
        await clearAuthState(page);

        await loginAs(page, 'USER');
        await createSuggestionViaUI(page, suggestionTitle);

        await loginAs(page, 'COMMITTEE_MANAGER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Komite İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Revizyon İste' }).first().click();
        await expect(page.getByRole('heading', { name: 'Revizyon Talep Et' })).toBeVisible();

        await page.getByPlaceholder('Gerekçenizi detaylı bir şekilde açıklayınız...').fill('Komite revizyon talebi e2e test notu.');

        const committeeRevisionModal = page.getByRole('heading', { name: 'Revizyon Talep Et' }).locator('..');
        await committeeRevisionModal.getByRole('button', { name: 'Revizyon İste' }).click();

        await expect(page.getByText('Güncelleme Bekliyor')).toBeVisible();
    });

    test('COMMITTEE rejects USER suggestion', async ({ page }) => {
        test.setTimeout(120000);
        const suggestionTitle = `Committee Reject Suggestion ${Date.now()}`;

        await disableBlockingDialogs(page);
        await clearAuthState(page);

        await loginAs(page, 'USER');
        await createSuggestionViaUI(page, suggestionTitle);

        await loginAs(page, 'COMMITTEE_MANAGER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Komite İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Reddet' }).first().click();
        await expect(page.getByRole('heading', { name: 'Öneriyi Reddet' })).toBeVisible();

        await page.getByPlaceholder('Gerekçenizi detaylı bir şekilde açıklayınız...').fill('Komite red e2e test gerekcesi.');

        const committeeRejectModal = page.getByRole('heading', { name: 'Öneriyi Reddet' }).locator('..');
        await committeeRejectModal.getByRole('button', { name: 'Reddet' }).click();

        await expect(page.getByText('Komite Tarafından Reddedildi')).toBeVisible();
    });

    test('APPROVER rejects suggestion and returns it to committee review', async ({ page }) => {
        test.setTimeout(120000);
        const suggestionTitle = `Reject Flow Suggestion ${Date.now()}`;

        await disableBlockingDialogs(page);
        await clearAuthState(page);

        await loginAs(page, 'USER');
        await createSuggestionViaUI(page, suggestionTitle);

        await loginAs(page, 'COMMITTEE_MANAGER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Komite İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Onayla' }).first().click();
        await expect(page.getByRole('heading', { name: 'Öneriyi Onayla' })).toBeVisible();
        const committeeApproveModal = page.getByRole('heading', { name: 'Öneriyi Onayla' }).locator('..');
        await committeeApproveModal.locator('select').first().selectOption('KAIZEN');
        await committeeApproveModal.locator('select').nth(1).selectOption({ index: 1 });
        await page.getByPlaceholder('Varsa eklemek istediğiniz notlar...').fill('Komite onayi e2e reject-flow notu.');

        await committeeApproveModal.getByRole('button', { name: 'Onayla ve Gönder' }).click();
        await expect(page.getByText('Müdür Onayında')).toBeVisible();

        await loginAs(page, 'APPROVER');
        await openSuggestionFromList(page, suggestionTitle);

        await expect(page.getByRole('heading', { name: 'Yönetici İşlemleri' })).toBeVisible();
        await page.getByRole('button', { name: 'Reddet' }).first().click();
        await expect(page.getByRole('heading', { name: 'Öneriyi Reddet' })).toBeVisible();

        await page.getByPlaceholder('Red gerekçenizi detaylı bir şekilde açıklayınız...').fill('Mudur red e2e test gerekcesi.');

        const managerRejectModal = page.getByRole('heading', { name: 'Öneriyi Reddet' }).locator('..');
        await managerRejectModal.getByRole('button', { name: 'Reddet' }).click();

        await expect(page.getByText('Komite Onayında')).toBeVisible();
    });
});
