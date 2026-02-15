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
    await page.getByPlaceholder('Önerdiğiniz çözümü detaylı olarak açıklayın').fill('Playwright approval matrix solution details.');
    await page.getByPlaceholder('Şu anki durumu detaylı olarak açıklayın. Sorun veya iyileştirme alanı nedir?').fill('Playwright approval matrix current situation details.');
    await page.getByRole('checkbox', { name: 'Maliyet Tasarrufu' }).check();

    await page.getByRole('button', { name: /Kaydet ve Gönder/ }).click();
    await page.waitForURL('**/suggestions');
    await expect(page.getByText(title)).toBeVisible();
};

const openSuggestionFromList = async (page: Page, title: string) => {
    await page.goto('/suggestions');
    await expect(page.getByText(title)).toBeVisible();
    await page.getByText(title).first().click();
    await page.waitForURL('**/suggestions/*');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

const approveAsCommittee = async (page: Page, title: string) => {
    await loginAs(page, 'COMMITTEE_MANAGER');
    await openSuggestionFromList(page, title);

    await expect(page.getByRole('heading', { name: 'Komite İşlemleri' })).toBeVisible();
    await page.getByRole('button', { name: 'Onayla' }).first().click();
    await expect(page.getByRole('heading', { name: 'Öneriyi Onayla' })).toBeVisible();

    await page.locator('select').first().selectOption('KAIZEN');
    await page.getByPlaceholder('Varsa eklemek istediğiniz notlar...').fill('Komite onayi approval-matrix testi.');

    const committeeApproveModal = page.getByRole('heading', { name: 'Öneriyi Onayla' }).locator('..');
    await committeeApproveModal.getByRole('button', { name: 'Onayla ve Gönder' }).click();
    await expect(page.getByText('Müdür Onayında')).toBeVisible();
};

const approveAsManagerStep = async (
    page: Page,
    approverRole:
        | 'CHIEF_APPROVER'
        | 'APPROVER'
        | 'FACTORY_MANAGER_APPROVER'
        | 'GMY_APPROVER',
    title: string,
    isFinalStep: boolean
) => {
    await loginAs(page, approverRole);
    await openSuggestionFromList(page, title);

    await expect(page.getByRole('heading', { name: 'Yönetici İşlemleri' })).toBeVisible();
    await page.getByRole('button', { name: 'Onayla' }).first().click();
    await expect(page.getByRole('heading', { name: 'Öneriyi Onayla' })).toBeVisible();

    await page.getByPlaceholder('Varsa eklemek istediğiniz notlar...').fill(`Onay adimi: ${approverRole}`);
    const managerApproveModal = page.getByRole('heading', { name: 'Öneriyi Onayla' }).locator('..');
    await managerApproveModal.getByRole('button', { name: 'Onayla' }).click();

    if (isFinalStep) {
        await expect(page.getByText('Onaylandı')).toBeVisible();
    } else {
        await expect(page.getByText('Müdür Onayında', { exact: true })).toBeVisible();
    }
};

test.describe('Position-based approval matrix', () => {
    test.describe.configure({ mode: 'serial' });

    const scenarios: Array<{
        name: string;
        submitterRole: 'OPERATOR_USER' | 'USER' | 'CHIEF_USER';
        approvers: Array<'CHIEF_APPROVER' | 'APPROVER' | 'FACTORY_MANAGER_APPROVER' | 'GMY_APPROVER'>;
    }> = [
        {
            name: 'Operator submitter requires 4-step chain',
            submitterRole: 'OPERATOR_USER',
            approvers: ['CHIEF_APPROVER', 'APPROVER', 'FACTORY_MANAGER_APPROVER', 'GMY_APPROVER'],
        },
        {
            name: 'Specialist submitter requires 3-step chain',
            submitterRole: 'USER',
            approvers: ['APPROVER', 'FACTORY_MANAGER_APPROVER', 'GMY_APPROVER'],
        },
        {
            name: 'Chief submitter requires 3-step chain (without chief approver)',
            submitterRole: 'CHIEF_USER',
            approvers: ['APPROVER', 'FACTORY_MANAGER_APPROVER', 'GMY_APPROVER'],
        },
    ];

    for (const scenario of scenarios) {
        test(scenario.name, async ({ page }) => {
            test.setTimeout(180000);
            const title = `Approval Matrix ${scenario.submitterRole} ${Date.now()}`;

            await disableBlockingDialogs(page);
            await clearAuthState(page);

            await loginAs(page, scenario.submitterRole);
            await createSuggestionViaUI(page, title);
            await approveAsCommittee(page, title);

            for (let i = 0; i < scenario.approvers.length; i++) {
                const approverRole = scenario.approvers[i];
                const isFinalStep = i === scenario.approvers.length - 1;
                await approveAsManagerStep(page, approverRole, title, isFinalStep);
            }
        });
    }
});
