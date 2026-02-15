import type { Page } from '@playwright/test';

type RoleKey = 'USER' | 'COMMITTEE_MANAGER' | 'APPROVER' | 'ADMIN';

interface AccountCredentials {
    employeeId: string;
    initialPassword: string;
    updatedPassword: string;
}

const ACCOUNTS: Record<RoleKey, AccountCredentials> = {
    USER: {
        employeeId: 'USER001',
        initialPassword: 'Test1234',
        updatedPassword: 'Test12345',
    },
    COMMITTEE_MANAGER: {
        employeeId: 'KOMITE001',
        initialPassword: 'Komite1234',
        updatedPassword: 'Komite12345',
    },
    APPROVER: {
        employeeId: 'MUDUR001',
        initialPassword: 'Onay1234',
        updatedPassword: 'Onay12345',
    },
    ADMIN: {
        employeeId: 'ADMIN001',
        initialPassword: 'Admin123',
        updatedPassword: 'Admin12345',
    },
};

const submitLoginForm = async (page: Page, employeeId: string, password: string) => {
    await page.getByLabel('Sicil No').fill(employeeId);
    await page.getByLabel('Şifre').fill(password);
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    const timeoutMs = 12000;
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) return 'dashboard' as const;
        if (currentUrl.includes('/change-password')) return 'change-password' as const;
        if (await page.locator('[data-testid="login-error"]').isVisible().catch(() => false)) return 'error' as const;
        await page.waitForTimeout(200);
    }

    throw new Error(`Login outcome timeout for ${employeeId}. Current URL: ${page.url()}`);
};

const waitForLoginHydration = async (page: Page) => {
    const quickFillButton = page.getByRole('button', { name: 'Kullanıcı: USER001' });
    const employeeInput = page.getByLabel('Sicil No');

    for (let i = 0; i < 20; i++) {
        await quickFillButton.click();
        const value = await employeeInput.inputValue();
        if (value === 'USER001') return;
        await page.waitForTimeout(150);
    }

    throw new Error('Login page hydration did not complete in time');
};

const completeForcedPasswordChange = async (page: Page, currentPassword: string, newPassword: string) => {
    await page.getByLabel('Mevcut Şifre').fill(currentPassword);
    await page.getByLabel('Yeni Şifre', { exact: true }).fill(newPassword);
    await page.getByLabel('Yeni Şifre (Tekrar)').fill(newPassword);
    await page.getByRole('button', { name: 'Şifre Değiştir' }).click();
    await page.waitForURL('**/dashboard', { timeout: 12000 });
};

export const loginAs = async (page: Page, role: RoleKey) => {
    const account = ACCOUNTS[role];

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForLoginHydration(page);

    let result = await submitLoginForm(page, account.employeeId, account.initialPassword);

    if (result === 'error') {
        result = await submitLoginForm(page, account.employeeId, account.updatedPassword);
        if (result === 'error') {
            const errorText = await page.locator('[data-testid="login-error"]').innerText();
            throw new Error(`Login failed for ${account.employeeId}: ${errorText}`);
        }
    }

    if (result === 'change-password') {
        await completeForcedPasswordChange(page, account.initialPassword, account.updatedPassword);
    }

    await page.waitForURL('**/dashboard', { timeout: 12000 });
};

export const clearAuthState = async (page: Page) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.removeItem('opex-auth');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
};
